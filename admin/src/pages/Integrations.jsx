import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, BookOpen, Check, Copy, KeyRound,
  Link2, Loader2, Plus, RefreshCw, RotateCw, Save, ShieldCheck, Trash2,
  Webhook, XCircle,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SCOPE_OPTIONS = [
  ['shipments:read', 'Read shipments'],
  ['shipments:write', 'Create and update shipments'],
  ['receipts:read', 'Download receipts'],
  ['tracking:read', 'Read tracking history'],
  ['tracking_events:write', 'Add tracking events'],
];
const EVENT_OPTIONS = [
  'shipment.created',
  'shipment.updated',
  'shipment.dispatched',
  'shipment.in_transit',
  'shipment.delivered',
  'shipment.cancelled',
];
const EMPTY_COMPANY = { name: '', contactName: '', email: '', phone: '', address: '', city: '', country: '' };
const EMPTY_KEY = { name: '', environment: 'test', scopes: ['shipments:read', 'shipments:write', 'tracking:read'] };
const EMPTY_WEBHOOK = { name: '', url: '', environment: 'test', events: ['shipment.created', 'shipment.updated'], secret: '' };
const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('dxt_admin_token')}` },
});

const Integrations = () => {
  const [company, setCompany] = useState(EMPTY_COMPANY);
  const [clients, setClients] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [keyForm, setKeyForm] = useState(EMPTY_KEY);
  const [webhookForm, setWebhookForm] = useState(EMPTY_WEBHOOK);
  const [scopeDrafts, setScopeDrafts] = useState({});
  const [newApiKey, setNewApiKey] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const config = authConfig();
      const [companyRes, clientsRes, webhooksRes, logsRes, deliveriesRes, statsRes, auditRes] = await Promise.all([
        axios.get(`${API_URL}/admin/integrations/company`, config),
        axios.get(`${API_URL}/admin/integrations/clients`, config),
        axios.get(`${API_URL}/admin/integrations/webhooks`, config),
        axios.get(`${API_URL}/admin/integrations/logs?limit=30`, config),
        axios.get(`${API_URL}/admin/integrations/webhook-deliveries?limit=30`, config),
        axios.get(`${API_URL}/admin/integrations/stats`, config),
        axios.get(`${API_URL}/admin/integrations/audit-logs?limit=30`, config),
      ]);
      setCompany({ ...EMPTY_COMPANY, ...companyRes.data.data });
      setClients(clientsRes.data.data);
      setWebhooks(webhooksRes.data.data);
      setLogs(logsRes.data.data);
      setDeliveries(deliveriesRes.data.data);
      setStats(statsRes.data.data);
      setAuditLogs(auditRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load API integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeClients = useMemo(() => clients.filter((client) => !client.revokedAt).length, [clients]);

  const saveCompany = async (event) => {
    event.preventDefault();
    setSavingCompany(true);
    try {
      await axios.put(`${API_URL}/admin/integrations/company`, company, authConfig());
      toast.success('Company sender profile saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save company profile');
    } finally {
      setSavingCompany(false);
    }
  };

  const createApiKey = async (event) => {
    event.preventDefault();
    setCreatingKey(true);
    try {
      const response = await axios.post(`${API_URL}/admin/integrations/clients`, keyForm, authConfig());
      setNewApiKey(response.data.apiKey);
      setKeyForm(EMPTY_KEY);
      toast.success('API key created');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const rotateKey = async (client) => {
    if (!window.confirm(`Regenerate the ${client.environment} key for ${client.name}? The current key will stop working immediately.`)) return;
    try {
      const response = await axios.post(`${API_URL}/admin/integrations/clients/${client._id}/rotate`, {}, authConfig());
      setNewApiKey(response.data.apiKey);
      toast.success('API key regenerated');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not regenerate API key');
    }
  };

  const revokeKey = async (client) => {
    if (!window.confirm(`Revoke the API key for ${client.name}? This cannot be undone.`)) return;
    try {
      await axios.post(`${API_URL}/admin/integrations/clients/${client._id}/revoke`, {}, authConfig());
      toast.success('API key revoked');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not revoke API key');
    }
  };

  const saveScopes = async (client) => {
    try {
      await axios.patch(`${API_URL}/admin/integrations/clients/${client._id}/scopes`, { scopes: scopeDrafts[client._id] || client.scopes }, authConfig());
      toast.success('API permissions updated');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update API permissions');
    }
  };

  const toggleScope = (scope) => {
    setKeyForm((current) => ({
      ...current,
      scopes: current.scopes.includes(scope)
        ? current.scopes.filter((item) => item !== scope)
        : [...current.scopes, scope],
    }));
  };

  const createWebhook = async (event) => {
    event.preventDefault();
    setCreatingWebhook(true);
    try {
      await axios.post(`${API_URL}/admin/integrations/webhooks`, webhookForm, authConfig());
      setWebhookForm(EMPTY_WEBHOOK);
      toast.success('Webhook endpoint saved');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save webhook');
    } finally {
      setCreatingWebhook(false);
    }
  };

  const toggleEvent = (eventName) => {
    setWebhookForm((current) => ({
      ...current,
      events: current.events.includes(eventName)
        ? current.events.filter((item) => item !== eventName)
        : [...current.events, eventName],
    }));
  };

  const toggleWebhook = async (endpoint) => {
    try {
      await axios.patch(`${API_URL}/admin/integrations/webhooks/${endpoint._id}`, { enabled: !endpoint.enabled }, authConfig());
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update webhook');
    }
  };

  const rotateWebhookSecret = async (endpoint) => {
    const secret = window.prompt('Enter the new shared signing secret (32-256 characters). It must also be updated on the receiver.');
    if (secret === null) return;
    try {
      await axios.patch(`${API_URL}/admin/integrations/webhooks/${endpoint._id}`, { secret }, authConfig());
      toast.success('Webhook signing secret rotated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not rotate webhook secret');
    }
  };

  const revokeWebhook = async (endpoint) => {
    if (!window.confirm(`Revoke webhook ${endpoint.name}?`)) return;
    try {
      await axios.post(`${API_URL}/admin/integrations/webhooks/${endpoint._id}/revoke`, {}, authConfig());
      toast.success('Webhook revoked');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not revoke webhook');
    }
  };

  const retryDelivery = async (delivery) => {
    try {
      await axios.post(`${API_URL}/admin/integrations/webhook-deliveries/${delivery._id}/retry`, {}, authConfig());
      toast.success('Delivery queued for retry');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not retry delivery');
    }
  };

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(newApiKey);
    toast.success('API key copied');
  };

  if (loading) {
    return <div className="flex h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-admin-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
      <section className="integration-hero overflow-hidden rounded-3xl p-7 text-white md:p-9">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em]">
              <ShieldCheck className="h-4 w-4" /> Secure partner access
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">API & Integrations</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 md:text-base">
              Manage scoped credentials, monitor traffic, and send signed shipment updates to Credixa Shopping.
            </p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg" to="/integrations/docs">
            <BookOpen className="h-4 w-4" /> API documentation
          </Link>
        </div>
        <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Active API keys', activeClients],
            ['Requests · 30 days', stats?.requests?.total || 0],
            ['Webhook deliveries', Object.values(stats?.webhookDeliveries || {}).reduce((sum, count) => sum + count, 0)],
            ['Active webhooks', stats?.activeWebhooks || 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[.08] p-4 backdrop-blur">
              <div className="text-2xl font-black">{value}</div>
              <div className="mt-1 text-xs font-medium text-white/65">{label}</div>
            </div>
              ))}
            </div>
            <div className="relative z-10 mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {[
                ['Company sender', stats?.companyProfileComplete],
                ['Payment verification', stats?.paymentVerificationConfigured],
                ['Encrypted webhook secrets', stats?.secretEncryptionConfigured],
              ].map(([label, ready]) => <span key={label} className={`rounded-full border px-3 py-1.5 ${ready ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'}`}>{ready ? 'Ready' : 'Needs setup'} · {label}</span>)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <form className="admin-card space-y-4" onSubmit={saveCompany}>
          <div className="flex items-start justify-between gap-4">
            <div><h3 className="text-lg font-bold">Company sender profile</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">API-created shipments use this verified sender instead of shopping-site input.</p></div>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10"><ShieldCheck className="h-5 w-5" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.keys(EMPTY_COMPANY).map((field) => (
              <label className="text-xs font-semibold capitalize text-slate-500" key={field}>
                {field === 'contactName' ? 'Contact name' : field}
                <input className="admin-input mt-1.5" required={['name', 'email', 'phone', 'address', 'city', 'country'].includes(field)} type={field === 'email' ? 'email' : 'text'} value={company[field] || ''} onChange={(event) => setCompany({ ...company, [field]: event.target.value })} />
              </label>
            ))}
          </div>
          <button className="admin-btn inline-flex items-center gap-2" disabled={savingCompany}><Save className="h-4 w-4" />{savingCompany ? 'Saving…' : 'Save sender profile'}</button>
        </form>

        <form className="admin-card space-y-4" onSubmit={createApiKey}>
          <div className="flex items-start justify-between gap-4">
            <div><h3 className="text-lg font-bold">Create API key</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Credentials are generated on the server and shown only once.</p></div>
            <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"><KeyRound className="h-5 w-5" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-500">Integration name
              <input className="admin-input mt-1.5" required maxLength={100} value={keyForm.name} onChange={(event) => setKeyForm({ ...keyForm, name: event.target.value })} placeholder="Credixa Shopping" />
            </label>
            <label className="text-xs font-semibold text-slate-500">Environment
              <select className="admin-input mt-1.5" value={keyForm.environment} onChange={(event) => setKeyForm({ ...keyForm, environment: event.target.value })}>
                <option value="test">Test</option><option value="production">Production</option>
              </select>
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCOPE_OPTIONS.map(([scope, label]) => (
              <label key={scope} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <input type="checkbox" checked={keyForm.scopes.includes(scope)} onChange={() => toggleScope(scope)} className="accent-teal-600" />{label}
              </label>
            ))}
          </div>
          <button className="admin-btn inline-flex items-center gap-2" disabled={creatingKey}><Plus className="h-4 w-4" />{creatingKey ? 'Creating…' : 'Generate key'}</button>
        </form>
      </div>

      <section className="admin-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold">API credentials</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Revoke compromised credentials or rotate keys without revealing existing secrets.</p></div><Activity className="h-5 w-5 text-admin-primary" /></div>
        <div className="space-y-3">
          {clients.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-900">No API clients have been created.</p>}
          {clients.map((client) => (
            <div key={client._id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 md:flex-row md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-bold">{client.name}<span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${client.environment === 'production' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'}`}>{client.environment}</span>{client.revokedAt && <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase text-red-700 dark:bg-red-500/10 dark:text-red-300">Revoked</span>}</div>
                <div className="mt-1 font-mono text-xs text-slate-500">{client.keyPrefix}••••••••</div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-admin-primary">Manage permissions</summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {SCOPE_OPTIONS.map(([scope, label]) => {
                      const selectedScopes = scopeDrafts[client._id] || client.scopes;
                      return <label key={scope} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" disabled={Boolean(client.revokedAt)} checked={selectedScopes.includes(scope)} onChange={() => setScopeDrafts((current) => ({ ...current, [client._id]: selectedScopes.includes(scope) ? selectedScopes.filter((item) => item !== scope) : [...selectedScopes, scope] }))} className="accent-teal-600" />{label}</label>;
                    })}
                    <button className="admin-btn-secondary mt-1 !px-3 !py-2 text-xs" disabled={Boolean(client.revokedAt)} onClick={() => saveScopes(client)}>Save permissions</button>
                  </div>
                </details>
                <div className="mt-2 text-xs text-slate-400">Last used: {client.lastUsedAt ? new Date(client.lastUsedAt).toLocaleString() : 'Never'}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!client.revokedAt && <button className="admin-btn-secondary inline-flex items-center gap-2 !px-3 !py-2 text-xs" onClick={() => rotateKey(client)}><RotateCw className="h-4 w-4" />Regenerate</button>}
                {!client.revokedAt && <button className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300" onClick={() => revokeKey(client)}><XCircle className="h-4 w-4" />Revoke</button>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <form className="admin-card space-y-4" onSubmit={createWebhook}>
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">Configure webhook</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">HTTPS only. Shared secrets are encrypted and never returned.</p></div><Webhook className="h-5 w-5 text-admin-primary" /></div>
          <label className="block text-xs font-semibold text-slate-500">Endpoint name<input className="admin-input mt-1.5" required maxLength={100} value={webhookForm.name} onChange={(event) => setWebhookForm({ ...webhookForm, name: event.target.value })} placeholder="Credixa order updates" /></label>
          <label className="block text-xs font-semibold text-slate-500">HTTPS endpoint URL<input className="admin-input mt-1.5" type="url" required value={webhookForm.url} onChange={(event) => setWebhookForm({ ...webhookForm, url: event.target.value })} placeholder="https://shop.example.com/webhooks/logistics" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-500">Environment<select className="admin-input mt-1.5" value={webhookForm.environment} onChange={(event) => setWebhookForm({ ...webhookForm, environment: event.target.value })}><option value="test">Test</option><option value="production">Production</option></select></label>
            <label className="text-xs font-semibold text-slate-500">Shared signing secret<input className="admin-input mt-1.5" type="password" autoComplete="new-password" minLength={32} maxLength={256} required value={webhookForm.secret} onChange={(event) => setWebhookForm({ ...webhookForm, secret: event.target.value })} placeholder="At least 32 characters" /></label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {EVENT_OPTIONS.map((eventName) => <label key={eventName} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-900"><input type="checkbox" checked={webhookForm.events.includes(eventName)} onChange={() => toggleEvent(eventName)} className="accent-teal-600" />{eventName}</label>)}
          </div>
          <button className="admin-btn inline-flex items-center gap-2" disabled={creatingWebhook}><Link2 className="h-4 w-4" />{creatingWebhook ? 'Saving…' : 'Add endpoint'}</button>
        </form>

        <section className="admin-card">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold">Webhook destinations</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Rotate by entering the replacement secret configured in the receiving service.</p></div><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={loadData} title="Refresh"><RefreshCw className="h-4 w-4" /></button></div>
          <div className="space-y-3">
            {webhooks.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-900">No webhook destinations configured.</p>}
            {webhooks.map((endpoint) => (
              <div key={endpoint._id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0"><div className="font-bold">{endpoint.name} <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase dark:bg-slate-800">{endpoint.environment}</span></div><div className="mt-1 break-all font-mono text-xs text-slate-500">{endpoint.url}</div></div>
                  <div className="flex gap-2">
                    <button className="admin-btn-secondary inline-flex items-center gap-1.5 !px-3 !py-2 text-xs" onClick={() => rotateWebhookSecret(endpoint)}><RotateCw className="h-3.5 w-3.5" />Rotate secret</button>
                    <button className={`rounded-xl px-3 py-2 text-xs font-bold ${endpoint.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`} onClick={() => toggleWebhook(endpoint)}>{endpoint.enabled ? 'Enabled' : 'Enable'}</button>
                    {!endpoint.revokedAt && <button className="rounded-xl bg-red-50 p-2 text-red-600 dark:bg-red-500/10 dark:text-red-300" onClick={() => revokeWebhook(endpoint)} aria-label="Revoke webhook"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">{endpoint.events.map((eventName) => <span key={eventName} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{eventName}</span>)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold">Webhook delivery history</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Failed deliveries remain visible here and can be retried manually.</p></div><span className="inline-flex items-center gap-2 text-xs font-bold text-amber-600"><AlertTriangle className="h-4 w-4" />{stats?.webhookDeliveries?.failed || 0} failed</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-700"><th className="pb-3">Event</th><th className="pb-3">Destination</th><th className="pb-3">Status</th><th className="pb-3">Attempts</th><th className="pb-3">Latest result</th><th className="pb-3"></th></tr></thead>
            <tbody>{deliveries.map((delivery) => (
              <tr className="border-b border-slate-100 dark:border-slate-800" key={delivery._id}>
                <td className="py-3"><div className="font-semibold">{delivery.eventType}</div><div className="mt-1 text-xs text-slate-400">{new Date(delivery.createdAt).toLocaleString()}</div></td>
                <td className="py-3">{delivery.endpointId?.name || 'Deleted endpoint'}</td>
                <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${delivery.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : delivery.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{delivery.status}</span></td>
                <td className="py-3">{delivery.attemptCount}</td>
                <td className="max-w-xs truncate py-3 text-xs text-slate-500">{delivery.lastError || (delivery.lastStatusCode ? `HTTP ${delivery.lastStatusCode}` : '—')}</td>
                <td className="py-3 text-right">{delivery.status === 'failed' && <button className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300" onClick={() => retryDelivery(delivery)}><RotateCw className="h-3.5 w-3.5" />Retry</button>}</td>
              </tr>
            ))}</tbody>
          </table>
          {!deliveries.length && <p className="py-6 text-center text-sm text-slate-500">No webhook deliveries yet.</p>}
        </div>
      </section>

      <section className="admin-card">
        <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold">API request log</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent authenticated requests, response codes, and latency.</p></div><Activity className="h-5 w-5 text-admin-primary" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-700"><th className="pb-3">Time</th><th className="pb-3">Client</th><th className="pb-3">Request</th><th className="pb-3">Status</th><th className="pb-3">Duration</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log._id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td><td className="py-3">{log.clientName || 'Unknown'} <span className="ml-1 text-[10px] uppercase text-slate-400">{log.environment}</span></td><td className="py-3 font-mono text-xs">{log.method} {log.path}</td><td className="py-3"><span className={log.statusCode >= 400 ? 'font-bold text-red-600' : 'font-bold text-emerald-600'}>{log.statusCode}</span></td><td className="py-3">{log.durationMs} ms</td></tr>)}</tbody>
          </table>
          {!logs.length && <p className="py-6 text-center text-sm text-slate-500">No API traffic recorded yet.</p>}
        </div>
      </section>

      <section className="admin-card">
        <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold">Integration audit trail</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Administrator actions for keys, permissions, company profile, and webhooks.</p></div><ShieldCheck className="h-5 w-5 text-admin-primary" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-700"><th className="pb-3">Time</th><th className="pb-3">Administrator</th><th className="pb-3">Action</th><th className="pb-3">Resource</th></tr></thead>
            <tbody>{auditLogs.map((entry) => <tr key={entry._id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td><td className="py-3">{entry.actorEmail || 'Administrator'}</td><td className="py-3 font-mono text-xs">{entry.action}</td><td className="py-3">{entry.resourceName || entry.resourceType}</td></tr>)}</tbody>
          </table>
          {!auditLogs.length && <p className="py-6 text-center text-sm text-slate-500">No administrative integration changes yet.</p>}
        </div>
      </section>

      {newApiKey && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="flex items-start justify-between"><div><div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10"><Check className="h-5 w-5" /></div><h3 className="text-xl font-black">Save your API key</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This secret is shown once. Copy it now and store it in Credixa’s server-side secret manager.</p></div><button onClick={() => setNewApiKey('')} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><XCircle className="h-5 w-5" /></button></div>
          <div className="mt-5 flex gap-2"><code className="min-w-0 flex-1 break-all rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">{newApiKey}</code><button onClick={copyApiKey} className="rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-700 dark:bg-admin-primary"><Copy className="h-4 w-4" /></button></div>
          <button onClick={() => setNewApiKey('')} className="admin-btn mt-5 w-full">I saved this key</button>
        </div>
      </div>}
    </motion.div>
  );
};

export default Integrations;
