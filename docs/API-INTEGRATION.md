# Credixa Logistics API & Webhooks

Base URL: `https://<your-logistics-api-host>/api/v1/integrations`

Test and production credentials are separate. A test credential uses the `crx_test_` prefix; a production credential uses `crx_live_`. Credentials are created, rotated, and revoked in the administrator dashboard under **API & Integrations**. The complete key is shown once and must be kept in the Credixa server-side secret manager. Never place it in browser code.

## Authentication and permissions

Send the key on every request:

```http
Authorization: Bearer crx_test_...
Content-Type: application/json
```

Available scopes:

| Scope | Allows |
|---|---|
| `shipments:write` | Create shipments and update shipment status |
| `shipments:read` | List and retrieve the client’s shipments |
| `tracking:read` | Read shipment tracking history |
| `tracking_events:write` | Add a tracking event |
| `receipts:read` | Download a shipment receipt PDF |

Credentials are restricted to the environment in which they were created. Shipment reads are also restricted to shipments created by that API client.

## Create a shipment

`POST /shipments` requires `shipments:write`, a unique idempotency key, and a valid signed payment authorization. A retry with the same idempotency key and order returns the original shipment; reusing the key for another order returns `409`.

The request's optional `sender` object is validated for compatibility but is not used to select the shipment sender. The sender always comes from the company profile configured by a tracking administrator. The receiver is populated from `customer` and `delivery`.

### Credixa Commerce payment-confirmation flow

The separate Credixa Commerce backend must first verify the completed transaction with the trusted Credixa Banking backend. It must use Banking's authenticated server-to-server API and verify the corresponding Banking webhook according to Banking's documentation. Do not treat a browser redirect, browser-supplied status, or unverified webhook as payment confirmation. Generate the shipment authorization only after Banking confirms completion.

The Tracking API does not call Banking or verify a Banking transaction itself. It independently verifies the HMAC authorization below. Credixa Commerce must keep its API key and environment-matched signing secret in server-side secret storage; never send either secret or a generated signature to browser code.

### Exact shipment request

Send this request from the Credixa Commerce backend to the Tracking API:

```http
POST https://<tracking-api-host>/api/v1/integrations/shipments
Authorization: Bearer <INTEGRATION_API_KEY>
Content-Type: application/json
Idempotency-Key: credixa-order-84219-v1
X-Credixa-Payment-Timestamp: <Unix timestamp in seconds>
X-Credixa-Payment-Nonce: <fresh cryptographically secure nonce>
X-Credixa-Payment-Signature: <64-character lowercase hexadecimal HMAC-SHA256>
```

The API key must be a server-side integration key with the `shipments:write` scope and must belong to the same environment as the payment signing secret. `Idempotency-Key` must contain 8-128 characters from `A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, or `-`. The timestamp header is a base-10 Unix timestamp in seconds. The nonce must contain 16-128 characters from `A-Z`, `a-z`, `0-9`, `_`, or `-`; generate a new nonce for each authorization. The JSON body's `externalOrderId` and `paymentVerificationReference` must be the same values used in the signature.

The JSON request body is:

```json
{
  "externalOrderId": "order-84219",
  "customer": {
    "name": "Alex Customer",
    "email": "alex@example.com",
    "phone": "+14155550123"
  },
  "delivery": {
    "country": "United States",
    "city": "Austin",
    "address": "100 Congress Avenue, Suite 200"
  },
  "productDescription": "Retail order #84219",
  "shipmentReference": "store-fulfillment-84219",
  "paymentVerificationReference": "pay_01J..."
}
```

`externalOrderId`, `customer.name`, `customer.email`, `customer.phone`, `delivery.country`, `delivery.city`, `delivery.address`, `productDescription`, and `paymentVerificationReference` are required. The optional `sender` object is accepted for compatibility only; the Tracking API always uses the company profile configured by the logistics administrator as the shipment sender.

Request validation:

| Field | Constraints |
|---|---|
| `externalOrderId`, `productDescription`, `paymentVerificationReference` | Non-empty strings, up to 500 characters |
| `customer.name`, `customer.email`, `customer.phone` | Non-empty strings, up to 200 characters; email and phone formats are checked |
| `delivery.country`, `delivery.city` | Non-empty strings, up to 120 characters |
| `delivery.address` | Non-empty string, up to 500 characters |
| `shipmentReference` | Optional string, up to 120 characters |
| `sender` | Optional compatibility object; recognized fields only, each at most 200 characters |

Unknown body fields are rejected. The API trims the external order ID and payment verification reference before signature verification; Credixa Commerce should send those values without leading or trailing whitespace and sign those exact values.

```http
POST /api/v1/integrations/shipments
Authorization: Bearer crx_test_...
Idempotency-Key: credixa-order-84219-v1
X-Credixa-Payment-Timestamp: 1794654000
X-Credixa-Payment-Nonce: 0123456789abcdef0123456789abcdef
X-Credixa-Payment-Signature: <64 lowercase hex characters>
Content-Type: application/json
```

```json
{
  "externalOrderId": "order-84219",
  "customer": {
    "name": "Alex Customer",
    "email": "alex@example.com",
    "phone": "+14155550123"
  },
  "sender": {
    "companyName": "Validated for compatibility; not trusted as shipment sender"
  },
  "delivery": {
    "country": "United States",
    "city": "Austin",
    "address": "100 Congress Avenue, Suite 200"
  },
  "productDescription": "Retail order #84219",
  "shipmentReference": "store-fulfillment-84219",
  "paymentVerificationReference": "pay_01J..."
}
```

### Trusted payment proof

Credixa Commerce and the Tracking API must each be configured with the matching environment secret. Store separate test and production secrets as `CREDIXA_PAYMENT_SIGNING_SECRET_TEST` and `CREDIXA_PAYMENT_SIGNING_SECRET_PRODUCTION`; each must contain at least 32 characters. Never put these secrets in frontend environment variables, browser JavaScript, the request body, logs, or API responses.

Use the secret matching the integration API client's environment. Create a fresh cryptographically secure nonce and use the current Unix timestamp in seconds. Build the canonical message from the exact `externalOrderId`, `paymentVerificationReference`, timestamp string, and nonce:

```text
canonical = externalOrderId + "." + paymentVerificationReference + "." + timestamp + "." + nonce
signature = lowercase_hex(HMAC-SHA256(shared_secret, UTF8(canonical)))
```

The signature is the 32-byte HMAC-SHA256 digest encoded as 64 lowercase hexadecimal characters. Do not JSON-encode the canonical message, add whitespace, or change the delimiter/order. The Tracking API accepts a timestamp no more than 300 seconds before or after its current time. A nonce is unique across payment authorizations and is inserted under a database uniqueness constraint in the same transaction as shipment creation; concurrent attempts to consume a nonce cannot both succeed.

Example Node.js signing code for the Credixa Commerce server, to call only after the trusted Banking API/webhook has independently confirmed payment:

```js
const crypto = require('node:crypto');
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(24).toString('hex');
const canonical = `${externalOrderId}.${paymentVerificationReference}.${timestamp}.${nonce}`;
const secret = integrationEnvironment === 'production'
  ? process.env.CREDIXA_PAYMENT_SIGNING_SECRET_PRODUCTION
  : process.env.CREDIXA_PAYMENT_SIGNING_SECRET_TEST;
if (!secret || secret.length < 32) throw new Error('Payment signing is not configured');
const signature = crypto.createHmac('sha256', secret)
  .update(canonical)
  .digest('hex');
```

Send the resulting `timestamp`, `nonce`, and `signature` in the three `X-Credixa-Payment-*` headers shown above. For a new shipment creation, the Tracking API independently chooses its secret from the authenticated API client's environment and verifies the HMAC with a constant-time comparison. It rejects missing/invalid signatures, malformed or expired timestamps, invalid nonces, and reused nonces. An exact idempotent retry is returned before a new payment authorization is evaluated, as described below. The API also requires `INTEGRATION_ENCRYPTION_KEY` (at least 32 characters) to encrypt webhook signing secrets at rest.

### Response

New shipment (`201 Created`):

```json
{
  "success": true,
  "data": {
    "trackingNumber": "TRX-12AB34CD",
    "receiptReference": "RCP-...",
    "trackingUrl": "https://tracking.example.com/track/TRX-12AB34CD",
    "externalOrderId": "order-84219",
    "status": "pending",
    "createdAt": "2026-11-14T10:00:00.000Z"
  }
}
```

Exact idempotent retry of a previously created order (`200 OK`):

```json
{
  "success": true,
  "idempotentReplay": true,
  "data": {
    "trackingNumber": "TRX-12AB34CD",
    "receiptReference": "RCP-...",
    "trackingUrl": "https://tracking.example.com/track/TRX-12AB34CD",
    "externalOrderId": "order-84219",
    "status": "pending",
    "createdAt": "2026-11-14T10:00:00.000Z"
  }
}
```

The idempotency key and normalized shipment fields must match the original request for this replay response. The idempotency hash covers the external order ID, customer, delivery, product description, shipment reference, and payment verification reference; the optional `sender` object is not included because it does not determine the shipment sender. An exact replay returns the original result without creating another shipment or consuming a new payment nonce. Reusing the key for a changed hashed field returns `409 IDEMPOTENCY_CONFLICT`; creating a second shipment for the same external order returns `409 DUPLICATE_ORDER`.

The existing receipt generator and tracking-number format are reused. The API-created shipment begins with zero estimated weight and delivery price because the integration request does not define either; administrators can update those fields in the tracking dashboard.

## Shipment and tracking endpoints

| Method and path | Required scope | Description |
|---|---|---|
| `GET /shipments?page=1&limit=20` | `shipments:read` | List this client's shipments; optional `externalOrderId` and `status` filters |
| `GET /shipments/by-order/{externalOrderId}` | `shipments:read` | Find this client's shipment by store order ID |
| `GET /shipments/{trackingNumber}` | `shipments:read`, `tracking:read` | Shipment summary and tracking history |
| `GET /shipments/{trackingNumber}/receipt` | `receipts:read` | Existing receipt as a PDF |
| `PATCH /shipments/{trackingNumber}/status` | `shipments:write` | Update status and append a status-history event |
| `POST /shipments/{trackingNumber}/events` | `tracking_events:write` | Append a tracking event |

Status request:

```json
{ "status": "in_transit", "location": "Chicago, IL", "description": "Departed regional hub" }
```

Allowed API status values: `pending`, `shipped`, `in_transit`, `arrived`, `delivered`, `stopped`, `cancelled`.

Tracking-event request:

```json
{ "status": "customs_cleared", "location": "Chicago, IL", "description": "Customs inspection complete" }
```

## Errors

Errors use JSON with `success: false`, a stable `code`, and a safe message. Validation errors may include a `fields` object.

| HTTP | Code | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid field or request header |
| `401` | `UNAUTHENTICATED` | Missing, invalid, expired, or revoked API key |
| `401` | `PAYMENT_AUTH_INVALID` | Missing/invalid signature or malformed nonce |
| `401` | `PAYMENT_AUTH_EXPIRED` | Missing, malformed, or out-of-window timestamp |
| `403` | `INSUFFICIENT_SCOPE` | API key lacks a required scope |
| `409` | `DUPLICATE_ORDER` | External order already has a shipment |
| `409` | `IDEMPOTENCY_CONFLICT` | Idempotency key was reused for another order |
| `409` | `PAYMENT_AUTH_REPLAYED` | Payment authorization nonce was already consumed |
| `404` | `SHIPMENT_NOT_FOUND` | Shipment not found for this client/environment |
| `429` | `RATE_LIMITED` | Request limit exceeded |
| `503` | `COMPANY_PROFILE_INCOMPLETE` | Admin must configure the shipment sender |
| `503` | `PAYMENT_AUTH_NOT_CONFIGURED` | Trusted payment authorization is not configured |

Payment authorization error examples:

```json
{
  "success": false,
  "code": "PAYMENT_AUTH_INVALID",
  "message": "Payment authorization signature is invalid"
}
```

```json
{
  "success": false,
  "code": "PAYMENT_AUTH_REPLAYED",
  "message": "Payment authorization has already been used"
}
```

## Webhooks

Configure an HTTPS receiver and a shared random secret (32-256 characters) in **API & Integrations**. The secret is encrypted at rest and write-only in the dashboard. For rotation, update the receiver and logistics dashboard to the same replacement secret.

Supported events: `shipment.created`, `shipment.updated`, `shipment.dispatched`, `shipment.in_transit`, `shipment.delivered`, `shipment.cancelled`. Manual dashboard changes to shipment details, location, status, or tracking history enqueue webhook notifications for the corresponding environment.

Each delivery is a JSON event with a unique event ID. The sender includes:

```http
X-Credixa-Event: shipment.in_transit
X-Credixa-Event-Id: evt_<uuid>
X-Credixa-Timestamp: <Unix timestamp in seconds>
X-Credixa-Signature: t=<timestamp>,v1=<hex HMAC>
```

The signature is `HMAC-SHA256(secret, UTF8(timestamp + "." + exact_raw_request_body))`. Verify it with a constant-time comparison, reject timestamps more than five minutes old, and deduplicate by `X-Credixa-Event-Id`. Return any 2xx response to acknowledge delivery. The sender retries failures with exponential backoff, up to 10 attempts; attempts and final failures are visible in the dashboard and may be manually retried.

## Testing checklist

1. Configure company sender details and the two server-side secrets.
2. Create a test API key with the minimum required scopes and a test webhook.
3. Use a test payment authorization signature generated by the trusted backend—not a production credential or real payment.
4. Create an order once, retry with the same idempotency key, then try the same order with another key.
5. Test invalid signatures, expired timestamps, replayed nonces, revoked keys, missing scopes, malformed fields, and rate limits.
6. Confirm the shipment, receipt, tracking URL, request log, and webhook event in the admin dashboard.
7. Test webhook signature verification, non-2xx retry, and manual retry before creating production credentials.
