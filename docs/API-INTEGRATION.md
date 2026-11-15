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

The trusted Credixa backend must sign only after its payment provider confirms a successful payment. Store separate test and production secrets as `CREDIXA_PAYMENT_SIGNING_SECRET_TEST` and `CREDIXA_PAYMENT_SIGNING_SECRET_PRODUCTION` on both backend services; use at least 32 random characters for each. The logistics API never accepts a boolean or a client-side claim that payment succeeded.

Create a fresh nonce for every authorization, use the current Unix timestamp in seconds, and calculate:

```text
canonical = externalOrderId + "." + paymentVerificationReference + "." + timestamp + "." + nonce
signature = lowercase_hex(HMAC-SHA256(shared_secret, UTF8(canonical)))
```

The timestamp must be within five minutes of the API server's time. A nonce can be used only once and is saved with a uniqueness constraint. Example Node.js signing code for the trusted Credixa server:

```js
const crypto = require('node:crypto');
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(24).toString('hex');
const canonical = `${externalOrderId}.${paymentReference}.${timestamp}.${nonce}`;
const secret = integrationEnvironment === 'production'
  ? process.env.CREDIXA_PAYMENT_SIGNING_SECRET_PRODUCTION
  : process.env.CREDIXA_PAYMENT_SIGNING_SECRET_TEST;
const signature = crypto.createHmac('sha256', secret)
  .update(canonical)
  .digest('hex');
```

The API also requires `INTEGRATION_ENCRYPTION_KEY` (at least 32 characters) to encrypt webhook signing secrets at rest. Configure both values only in backend secret settings, never Vite `VITE_*` variables.

### Response

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
| `401` | — | Invalid or expired payment proof |
| `403` | `INSUFFICIENT_SCOPE` | API key lacks a required scope |
| `409` | `DUPLICATE_ORDER` | External order already has a shipment |
| `409` | `IDEMPOTENCY_CONFLICT` | Idempotency key was reused for another order |
| `409` | — | Payment authorization nonce was replayed |
| `404` | `SHIPMENT_NOT_FOUND` | Shipment not found for this client/environment |
| `429` | `RATE_LIMITED` | Request limit exceeded |
| `503` | `COMPANY_PROFILE_INCOMPLETE` | Admin must configure the shipment sender |
| `503` | `PAYMENT_AUTH_NOT_CONFIGURED` | Trusted payment authorization is not configured |

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
