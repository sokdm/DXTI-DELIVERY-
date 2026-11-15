import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleAlert,
  Clock3, Copy, FileJson2, KeyRound, LockKeyhole, Package, Radio, ShieldCheck,
  Webhook,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_ROOT = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/v1/integrations`;
const permissions = [
  ['shipments:read', 'List and retrieve shipments created with this API client.'],
  ['shipments:write', 'Create shipments and update shipment statuses.'],
  ['tracking:read', 'Read shipment tracking history.'],
  ['tracking_events:write', 'Append tracking events to a shipment.'],
  ['receipts:read', 'Download shipment receipt PDFs.'],
];
const endpoints = [
  { method: 'POST', path: '/shipments', permission: 'shipments:write', detail: 'Create a shipment after trusted payment authorization.' },
  { method: 'GET', path: '/shipments', permission: 'shipments:read', detail: 'List this client’s shipments. Supports page, limit, status, and externalOrderId.' },
  { method: 'GET', path: '/shipments/by-order/{externalOrderId}', permission: 'shipments:read', detail: 'Find a shipment by the original shopping order ID.' },
  { method: 'GET', path: '/shipments/{trackingNumber}', permission: 'shipments:read + tracking:read', detail: 'Retrieve shipment summary, customer delivery details, and tracking history.' },
  { method: 'GET', path: '/shipments/{trackingNumber}/receipt', permission: 'receipts:read', detail: 'Download the existing shipment receipt as a PDF.' },
  { method: 'PATCH', path: '/shipments/{trackingNumber}/status', permission: 'shipments:write', detail: 'Update the shipment status and append a history event.' },
  { method: 'POST', path: '/shipments/{trackingNumber}/events', permission: 'tracking_events:write', detail: 'Add a location and tracking event.' },
];
const events = [
  ['shipment.created', 'A shipment was created from an authorized order.'],
  ['shipment.updated', 'Shipment details, location, receipt, or a tracking event changed.'],
  ['shipment.dispatched', 'Shipment status changed to shipped/dispatched.'],
  ['shipment.in_transit', 'Shipment status changed to in transit.'],
  ['shipment.delivered', 'Shipment status changed to delivered.'],
  ['shipment.cancelled', 'Shipment was cancelled.'],
];
const errors = [
  ['400', 'VALIDATION_ERROR', 'A request field or required header is invalid.'],
  ['401', 'UNAUTHENTICATED', 'API key is missing, invalid, or revoked.'],
  ['401', 'PAYMENT_AUTH_INVALID / PAYMENT_AUTH_EXPIRED', 'Trusted payment authorization is missing or expired.'],
  ['403', 'INSUFFICIENT_SCOPE', 'The API key lacks a required permission.'],
  ['409', 'DUPLICATE_ORDER / IDEMPOTENCY_CONFLICT', 'The order already exists or the idempotency key was reused with different data.'],
  ['429', 'RATE_LIMITED', 'Request limit exceeded; retry after the rate-limit window.'],
  ['503', 'PAYMENT_AUTH_NOT_CONFIGURED', 'Trusted payment verification needs server-side configuration.'],
];

const shipmentExample = JSON.stringify({
  externalOrderId: 'order-84219',
  customer: { name: 'Alex Customer', email: 'alex@example.com', phone: '+14155550123' },
  delivery: { country: 'United States', city: 'Austin', address: '100 Congress Avenue, Suite 200' },
  productDescription: 'Retail order #84219',
  shipmentReference: 'fulfillment-84219',
  paymentVerificationReference: 'pay_01J...',
}, null, 2);

const responseExample = JSON.stringify({
  success: true,
  data: {
    trackingNumber: 'TRX-12AB34CD',
    receiptReference: 'RCP-...',
    trackingUrl: 'https://tracking.example.com/track/TRX-12AB34CD',
    externalOrderId: 'order-84219',
    status: 'pending',
    createdAt: '2026-11-15T08:30:00.000Z',
  },
}, null, 2);

const navItems = [
  ['overview', 'Overview'],
  ['authentication', 'Authentication'],
  ['permissions', 'Permissions'],
  ['create-shipment', 'Create shipment'],
  ['endpoints', 'Endpoint reference'],
  ['webhooks', 'Webhooks'],
  ['errors', 'Errors & testing'],
];

const CodeBlock = ({ children, label = 'JSON', copyKey, copied, onCopy }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220] shadow-xl shadow-slate-950/10">
    <div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3">
      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="font-mono text-[11px] font-bold text-slate-300">{label}</span></div>
      <button onClick={() => onCopy(copyKey, children)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-400 transition hover:bg-white/10 hover:text-white">
        {copied === copyKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied === copyKey ? 'Copied' : 'Copy'}
      </button>
    </div>
    <pre className="max-h-[440px] overflow-auto p-5 text-xs leading-6 text-emerald-100 sm:text-[13px]"><code>{children}</code></pre>
  </div>
);

const SectionHeading = ({ eyebrow, title, children, icon: Icon }) => (
  <div className="mb-5">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-admin-primary"><Icon className="h-4 w-4" />{eyebrow}</div>
    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-[28px]">{title}</h2>
    {children && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{children}</p>}
  </div>
);

const IntegrationDocs = () => {
  const [copied, setCopied] = useState('');
  const copy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      toast.error('Clipboard access is unavailable in this browser');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1450px]">
      <section id="overview" className="docs-hero relative overflow-hidden rounded-[26px] p-6 text-white sm:p-9 lg:p-11">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.17em] text-emerald-100"><BookOpen className="h-3.5 w-3.5" /> Developer reference · v1</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Connect Credixa<br className="hidden sm:block" /> to your logistics.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Create trackable shipments from verified orders, retrieve delivery progress, and receive secure, signed shipment events.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#authentication" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-200">Get started <ArrowDownRight className="h-4 w-4" /></a>
              <Link to="/integrations" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[.06] px-4 py-3 text-xs font-bold text-white transition hover:bg-white/10">Manage API keys <KeyRound className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur sm:min-w-[320px]">
            <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">API base URL</div>
            <div className="flex items-center justify-between gap-3"><code className="min-w-0 break-all text-xs text-emerald-200">{API_ROOT}</code><button onClick={() => copy('base', API_ROOT)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Copy API base URL">{copied === 'base' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}</button></div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><LockKeyhole className="h-3.5 w-3.5 text-emerald-300" />HTTPS · Bearer token · JSON</div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[100px] rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="px-3 pb-3 pt-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">On this page</div>
            {navItems.map(([id, label], index) => <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-teal-50 hover:text-admin-primary dark:text-slate-400 dark:hover:bg-teal-500/10 dark:hover:text-emerald-300"><span className="w-4 font-mono text-[10px] text-slate-300">{String(index + 1).padStart(2, '0')}</span>{label}</a>)}
            <div className="mt-3 border-t border-slate-100 px-3 pt-3 dark:border-slate-800"><Link to="/integrations" className="flex items-center gap-2 text-xs font-bold text-admin-primary hover:text-teal-700">Open integration settings <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          </div>
        </aside>

        <div className="min-w-0 space-y-12">
          <section className="docs-section" id="authentication">
            <SectionHeading eyebrow="01 · Access" title="Authentication" icon={LockKeyhole}>Keep credentials on your server. API keys are generated by the administrator dashboard and are displayed only once.</SectionHeading>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="docs-info-card"><span className="docs-info-icon bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"><KeyRound className="h-5 w-5" /></span><div className="mt-4 text-sm font-extrabold">Test environment</div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Test keys begin with <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">crx_test_</code> and use test payment verification.</p></div>
              <div className="docs-info-card"><span className="docs-info-icon bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"><ShieldCheck className="h-5 w-5" /></span><div className="mt-4 text-sm font-extrabold">Production environment</div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Production keys begin with <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">crx_live_</code>. Never expose them in browser JavaScript.</p></div>
            </div>
            <div className="mt-4"><CodeBlock label="HTTP headers" copyKey="headers" copied={copied} onCopy={copy}>{`Authorization: Bearer crx_test_••••••••\nContent-Type: application/json\nIdempotency-Key: credixa-order-84219-v1`}</CodeBlock></div>
          </section>

          <section className="docs-section" id="permissions">
            <SectionHeading eyebrow="02 · Least privilege" title="Permissions & access scopes" icon={ShieldCheck}>Give each integration only the permissions it needs. Each API key is isolated to its test or production environment and its own created shipments.</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {permissions.map(([scope, detail], index) => <div key={scope} className={`flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}><code className="min-w-[205px] text-xs font-bold text-teal-700 dark:text-emerald-300">{scope}</code><p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p></div>)}
            </div>
          </section>

          <section className="docs-section" id="create-shipment">
            <SectionHeading eyebrow="03 · Orders" title="Create a shipment" icon={Package}>A valid payment authorization from the trusted Credixa backend is mandatory. The sender always comes from the company profile configured by your logistics administrator.</SectionHeading>
            <div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 font-mono text-[10px] font-black text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">POST</span><code className="text-xs font-bold text-slate-700 dark:text-slate-200">/shipments</code><span className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">shipments:write</span></div>
            <div className="space-y-4">
              <CodeBlock label="Request body · application/json" copyKey="request" copied={copied} onCopy={copy}>{shipmentExample}</CodeBlock>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/70 dark:bg-amber-500/[.07]">
                <div className="flex gap-3"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" /><div><div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">Payment authorization is server-to-server</div><p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-100/70">Sign <code className="font-mono">externalOrderId.paymentVerificationReference.timestamp.nonce</code> with the environment-specific HMAC-SHA256 secret. Use a fresh nonce and a timestamp within five minutes. Never accept payment claims from the browser.</p></div></div>
              </div>
              <CodeBlock label="Successful response · 201 Created" copyKey="response" copied={copied} onCopy={copy}>{responseExample}</CodeBlock>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="text-xs font-extrabold">Idempotency</div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Repeat the same request and key to safely return the original shipment. A changed payload or reused order returns a conflict.</p></div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="text-xs font-extrabold">Tracking & receipt</div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">The response includes the platform tracking number, existing receipt reference, and public tracking URL.</p></div>
              </div>
            </div>
          </section>

          <section className="docs-section" id="endpoints">
            <SectionHeading eyebrow="04 · Reference" title="Endpoint reference" icon={FileJson2}>All shipment endpoints are under the integration API base URL and require a bearer token with the listed scope.</SectionHeading>
            <div className="space-y-3">
              {endpoints.map((endpoint) => <article key={`${endpoint.method}-${endpoint.path}`} className="docs-endpoint">
                <div className="flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 font-mono text-[9px] font-black ${endpoint.method === 'GET' ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' : endpoint.method === 'PATCH' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>{endpoint.method}</span><code className="break-all text-xs font-bold text-slate-800 dark:text-slate-100">{endpoint.path}</code><span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{endpoint.permission}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{endpoint.detail}</p>
              </article>)}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="text-xs font-extrabold">Update status · PATCH body</div><pre className="mt-2 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-[10px] leading-5 text-emerald-200">{`{ "status": "in_transit",\n  "location": "Chicago, IL",\n  "description": "Departed regional hub" }`}</pre></div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="text-xs font-extrabold">Add tracking event · POST body</div><pre className="mt-2 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-[10px] leading-5 text-emerald-200">{`{ "status": "customs_cleared",\n  "location": "Chicago, IL",\n  "description": "Inspection complete" }`}</pre></div>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Status values: <code className="font-mono">pending, shipped, in_transit, arrived, delivered, stopped, cancelled</code>.</p>
          </section>

          <section className="docs-section" id="webhooks">
            <SectionHeading eyebrow="05 · Event delivery" title="Webhooks & signature verification" icon={Webhook}>Configure a public HTTPS receiver in API & Integrations. Secrets are encrypted at rest and shown only when you provide them.</SectionHeading>
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {events.map(([name, description], index) => <div key={name} className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}><code className="min-w-[190px] text-xs font-bold text-teal-700 dark:text-emerald-300">{name}</code><span className="text-xs text-slate-500 dark:text-slate-400">{description}</span></div>)}
            </div>
            <div className="mb-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold"><Radio className="h-4 w-4 text-admin-primary" /> Signed webhook headers</div>
              <pre className="overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-[10px] leading-5 text-sky-100">{`X-Credixa-Event: shipment.in_transit\nX-Credixa-Event-Id: evt_<uuid>\nX-Credixa-Timestamp: <unix-seconds>\nX-Credixa-Signature: t=<timestamp>,v1=<hex>`}</pre>
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Verify <code className="font-mono">HMAC-SHA256(secret, timestamp + "." + exact_raw_request_body)</code> using constant-time comparison. Reject timestamps older than five minutes and deduplicate by event ID. Return a 2xx response to acknowledge.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-center gap-2 text-xs font-extrabold"><Clock3 className="h-4 w-4 text-admin-primary" /> Delivery and retries</div><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Failed requests are retried with exponential backoff, up to 10 attempts. Review errors, delivery history, and manual retry controls in the <Link className="font-bold text-admin-primary hover:underline" to="/integrations">integration dashboard</Link>.</p></div>
          </section>

          <section className="docs-section" id="errors">
            <SectionHeading eyebrow="06 · Operations" title="Errors & go-live checklist" icon={CircleAlert}>Error responses contain a stable code and a safe message. Fix the issue before retrying instead of repeating the same invalid request.</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-[52px_minmax(150px,.8fr)_minmax(0,1.3fr)] gap-3 bg-slate-50 px-4 py-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:bg-slate-800/70"><span>HTTP</span><span>Code</span><span>Meaning</span></div>
              {errors.map(([status, code, detail]) => <div key={`${status}-${code}`} className="grid grid-cols-[52px_minmax(150px,.8fr)_minmax(0,1.3fr)] gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800"><span className="font-mono text-[10px] font-bold text-slate-500">{status}</span><code className="break-words text-[10px] font-bold text-teal-700 dark:text-emerald-300">{code}</code><span className="text-[10px] leading-5 text-slate-500 dark:text-slate-400">{detail}</span></div>)}
            </div>
            <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold"><Check className="h-4 w-4 text-emerald-400" /> Before going live</div>
              <ul className="grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                <li>• Configure the company sender profile.</li>
                <li>• Set separate test and production payment secrets.</li>
                <li>• Keep API keys only in server-side secret storage.</li>
                <li>• Test signature failures, replay, and idempotency.</li>
                <li>• Verify webhook signatures and duplicate handling.</li>
                <li>• Confirm delivery retries and operational monitoring.</li>
              </ul>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900/60 dark:bg-teal-500/[.07]"><div><div className="text-xs font-extrabold">Ready to configure access?</div><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Generate a restricted test key and configure your webhook endpoint.</p></div><Link to="/integrations" className="inline-flex items-center gap-1.5 rounded-xl bg-admin-primary px-3.5 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-teal-700">Open integrations <ChevronRight className="h-3.5 w-3.5" /></Link></div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default IntegrationDocs;
