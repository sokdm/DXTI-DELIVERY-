import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, BadgeCheck, Box, CalendarDays, CheckCircle2, ChevronDown, ChevronUp,
  Clock3, FileText, Image, Mail, MapPin, Package, Phone, ShieldCheck,
  Truck, UserRound, Weight, X,
} from 'lucide-react';
import MapTracker from './MapTracker';

const statusInfo = {
  pending: { label: 'Pending', icon: Clock3, tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  shipped: { label: 'Dispatched', icon: Truck, tone: 'bg-sky-50 text-sky-800 ring-sky-200' },
  in_transit: { label: 'In transit', icon: Truck, tone: 'bg-sky-50 text-sky-800 ring-sky-200' },
  arrived: { label: 'Arrived', icon: MapPin, tone: 'bg-indigo-50 text-indigo-800 ring-indigo-200' },
  delivered: { label: 'Delivered', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  stopped: { label: 'Stopped', icon: AlertCircle, tone: 'bg-rose-50 text-rose-800 ring-rose-200' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const locationName = (location, fallback) => {
  if (!location) return fallback;
  if (typeof location === 'string') return location;
  return location.locationName || location.name || location.city || fallback;
};

const formatAddress = (...parts) => parts.filter((part) => typeof part === 'string' && part.trim()).map((part) => part.trim()).join(', ');

const DetailLine = ({ icon: Icon, label, value, href }) => {
  if (!value) return null;
  const content = href
    ? <a href={href} className="break-words font-medium text-dhl-black transition hover:text-dhl-red dark:text-white dark:hover:text-teal-300">{value}</a>
    : <span className="break-words font-medium text-dhl-black dark:text-white">{value}</span>;

  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-dhl-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-dhl-gray-500 dark:text-dhl-gray-400">{label}</p>
        <div className="mt-1 text-sm">{content}</div>
      </div>
    </div>
  );
};

const TrackingResult = ({ packageData }) => {
  const [showDetails, setShowDetails] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const status = packageData.status || 'pending';
  const config = statusInfo[status] || {
    label: status.replace(/_/g, ' '),
    icon: Box,
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  const StatusIcon = config.icon;
  const senderAddress = formatAddress(packageData.senderAddress, packageData.senderCity, packageData.senderCountry);
  const receiverAddress = formatAddress(packageData.receiverAddress, packageData.receiverCity, packageData.receiverCountry);
  const receipt = packageData.receipt || {};

  const timeline = useMemo(() => {
    const events = packageData.statusHistory || packageData.timeline || [];
    return [...events].sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date || 0).getTime();
      const dateB = new Date(b.timestamp || b.date || 0).getTime();
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    });
  }, [packageData.statusHistory, packageData.timeline]);

  useEffect(() => {
    if (!lightboxImage) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const deliveryPrice = packageData.deliveryPrice;
  const price = deliveryPrice !== undefined && deliveryPrice !== null && deliveryPrice !== ''
    ? `${packageData.deliveryCurrencySymbol || '$'}${Number.isFinite(Number(deliveryPrice)) ? Number(deliveryPrice).toFixed(2) : deliveryPrice} ${packageData.deliveryCurrency || 'USD'}`
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="space-y-5">
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Shipment photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <button type="button" aria-label="Close photo" onClick={() => setLightboxImage(null)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
            <img src={lightboxImage} alt={packageData.packageName || 'Shipment photo'} className="max-h-[88vh] max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="overflow-hidden rounded-2xl border border-dhl-gray-200 bg-white shadow-sm dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${config.tone}`}>
                <StatusIcon className="h-3.5 w-3.5" /> {config.label}
              </span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[.16em] text-dhl-gray-500 dark:text-dhl-gray-400">Tracking number</p>
              <h2 className="mt-1 break-all font-mono text-2xl font-bold tracking-tight text-dhl-black dark:text-white sm:text-3xl">{packageData.trackingCode}</h2>
              {packageData.packageDescription && <p className="mt-2 max-w-2xl text-sm leading-6 text-dhl-gray-600 dark:text-dhl-gray-300">{packageData.packageDescription}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-dhl-gray-50 px-4 py-3 dark:bg-dhl-gray-900">
              <CalendarDays className="h-4 w-4 text-dhl-gray-400" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-dhl-gray-500 dark:text-dhl-gray-400">Shipment created</p>
                <p className="mt-0.5 text-xs font-semibold text-dhl-black dark:text-white">{formatDate(packageData.createdAt) || 'Date not available'}</p>
              </div>
            </div>
          </div>

          {status === 'stopped' && packageData.stopReason && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div><p className="text-sm font-semibold">Shipment stopped</p><p className="mt-1 text-sm leading-5">{packageData.stopReason}</p></div>
            </div>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dhl-gray-200 p-4 dark:border-dhl-gray-700">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-dhl-gray-500 dark:text-dhl-gray-400"><MapPin className="h-4 w-4 text-dhl-red" /> Current recorded location</div>
              <p className="mt-2 font-semibold text-dhl-black dark:text-white">{locationName(packageData.currentLocation, 'Not available')}</p>
            </div>
            <div className="rounded-xl border border-dhl-gray-200 p-4 dark:border-dhl-gray-700">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-dhl-gray-500 dark:text-dhl-gray-400"><MapPin className="h-4 w-4 text-dhl-yellow-dark" /> Destination</div>
              <p className="mt-2 font-semibold text-dhl-black dark:text-white">{locationName(packageData.destinationLocation, 'Not available')}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-dhl-gray-200 px-5 py-4 dark:border-dhl-gray-700 sm:px-7">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-dhl-gray-500 dark:text-dhl-gray-400">
            {formatDate(packageData.updatedAt) && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Record updated {formatDate(packageData.updatedAt)}</span>}
            {packageData.stopReason && status !== 'stopped' && <span className="inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {packageData.stopReason}</span>}
          </div>
        </div>
      </section>

      <MapTracker currentLocation={packageData.currentLocation} destination={packageData.destinationLocation} />

      <section className="overflow-hidden rounded-2xl border border-dhl-gray-200 bg-white dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
        <button type="button" aria-expanded={showHistory} onClick={() => setShowHistory((visible) => !visible)} className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-dhl-gray-50 dark:hover:bg-white/[.025] sm:px-6">
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300"><Clock3 className="h-5 w-5" /></span><span><span className="block font-semibold text-dhl-black dark:text-white">Tracking history</span><span className="mt-1 block text-xs text-dhl-gray-500 dark:text-dhl-gray-400">{timeline.length} recorded {timeline.length === 1 ? 'update' : 'updates'}</span></span></span>
          {showHistory ? <ChevronUp className="h-5 w-5 text-dhl-gray-400" /> : <ChevronDown className="h-5 w-5 text-dhl-gray-400" />}
        </button>
        <AnimatePresence initial={false}>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="border-t border-dhl-gray-200 px-5 py-5 dark:border-dhl-gray-700 sm:px-6">
                {timeline.length ? (
                  <ol className="space-y-0">
                    {timeline.map((event, index) => {
                      const eventLabel = statusInfo[event.status]?.label || (event.status || 'Update').replace(/_/g, ' ');
                      const date = formatDate(event.timestamp || event.date);
                      return (
                        <li key={`${event.timestamp || event.date || event.status}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                          {index < timeline.length - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-dhl-gray-200 dark:bg-dhl-gray-700" />}
                          <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${index === 0 ? 'bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300' : 'bg-dhl-gray-100 text-dhl-gray-500 dark:bg-dhl-gray-700 dark:text-dhl-gray-300'}`}>
                            {index === 0 ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                          </span>
                          <div className="min-w-0 flex-1 rounded-xl bg-dhl-gray-50 p-4 dark:bg-dhl-gray-900">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-semibold capitalize text-dhl-black dark:text-white">{eventLabel}</p>
                              {date && <time className="text-xs text-dhl-gray-500 dark:text-dhl-gray-400">{date}</time>}
                            </div>
                            {(event.description || event.location) && <p className="mt-2 text-sm leading-5 text-dhl-gray-600 dark:text-dhl-gray-300">{[event.location, event.description].filter(Boolean).join(' · ')}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="py-2 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">No tracking history has been recorded yet.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="overflow-hidden rounded-2xl border border-dhl-gray-200 bg-white dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
        <button type="button" aria-expanded={showDetails} onClick={() => setShowDetails((visible) => !visible)} className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-dhl-gray-50 dark:hover:bg-white/[.025] sm:px-6">
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300"><Package className="h-5 w-5" /></span><span><span className="block font-semibold text-dhl-black dark:text-white">Shipment details</span><span className="mt-1 block text-xs text-dhl-gray-500 dark:text-dhl-gray-400">Package, contacts and receipt information</span></span></span>
          {showDetails ? <ChevronUp className="h-5 w-5 text-dhl-gray-400" /> : <ChevronDown className="h-5 w-5 text-dhl-gray-400" />}
        </button>
        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-6 border-t border-dhl-gray-200 p-5 dark:border-dhl-gray-700 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
                  <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                    {packageData.packageImage && (
                      <button type="button" onClick={() => setLightboxImage(packageData.packageImage)} className="group relative h-48 w-full overflow-hidden rounded-xl bg-dhl-gray-100 text-left sm:w-56 lg:w-full">
                        <img src={packageData.packageImage} alt={packageData.packageName || 'Shipment package'} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-dhl-black/70 text-white"><Image className="h-4 w-4" /></span>
                      </button>
                    )}
                    {packageData.currentLocation?.image && (
                      <button type="button" onClick={() => setLightboxImage(packageData.currentLocation.image)} className="group relative h-48 w-full overflow-hidden rounded-xl bg-dhl-gray-100 text-left sm:w-56 lg:w-full">
                        <img src={packageData.currentLocation.image} alt="Recorded shipment location" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-dhl-black/70 text-white"><Image className="h-4 w-4" /></span>
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-dhl-gray-500 dark:text-dhl-gray-400">Package</p>
                      <h3 className="mt-2 text-lg font-semibold text-dhl-black dark:text-white">{packageData.packageName || 'Shipment package'}</h3>
                      {packageData.packageDescription && <p className="mt-2 text-sm leading-6 text-dhl-gray-600 dark:text-dhl-gray-300">{packageData.packageDescription}</p>}
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-dhl-gray-600 dark:text-dhl-gray-300">
                        {packageData.packageWeight !== undefined && packageData.packageWeight !== null && <span className="inline-flex items-center gap-2"><Weight className="h-4 w-4 text-dhl-gray-400" /> {packageData.packageWeight} kg</span>}
                        {price && <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-dhl-gray-400" /> {price}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-dhl-gray-200 p-4 dark:border-dhl-gray-700">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-dhl-black dark:text-white"><UserRound className="h-4 w-4 text-dhl-red" /> Sender</h3>
                      <div className="mt-2 divide-y divide-dhl-gray-100 dark:divide-dhl-gray-700">
                        <DetailLine icon={UserRound} label="Name" value={packageData.senderName} />
                        <DetailLine icon={MapPin} label="Address" value={senderAddress} />
                        <DetailLine icon={Phone} label="Phone" value={packageData.senderPhone} href={packageData.senderPhone ? `tel:${packageData.senderPhone}` : undefined} />
                        <DetailLine icon={Mail} label="Email" value={packageData.senderEmail} href={packageData.senderEmail ? `mailto:${packageData.senderEmail}` : undefined} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-dhl-gray-200 p-4 dark:border-dhl-gray-700">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-dhl-black dark:text-white"><UserRound className="h-4 w-4 text-dhl-red" /> Recipient</h3>
                      <div className="mt-2 divide-y divide-dhl-gray-100 dark:divide-dhl-gray-700">
                        <DetailLine icon={UserRound} label="Name" value={packageData.receiverName} />
                        <DetailLine icon={MapPin} label="Address" value={receiverAddress} />
                        <DetailLine icon={Phone} label="Phone" value={packageData.receiverPhone} href={packageData.receiverPhone ? `tel:${packageData.receiverPhone}` : undefined} />
                        <DetailLine icon={Mail} label="Email" value={packageData.receiverEmail} href={packageData.receiverEmail ? `mailto:${packageData.receiverEmail}` : undefined} />
                      </div>
                    </div>
                  </div>
                </div>

                {(receipt.receiptId || receipt.stamped || receipt.signature) && (
                  <div className="rounded-xl border border-dhl-gray-200 bg-dhl-gray-50 p-5 dark:border-dhl-gray-700 dark:bg-dhl-gray-900">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dhl-black dark:text-white"><FileText className="h-4 w-4 text-dhl-red" /> Receipt information</div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {receipt.receiptId && <div><p className="text-[11px] font-semibold uppercase tracking-wide text-dhl-gray-500 dark:text-dhl-gray-400">Receipt reference</p><p className="mt-1 break-all font-mono text-sm font-semibold text-dhl-black dark:text-white">{receipt.receiptId}</p></div>}
                      <div><p className="text-[11px] font-semibold uppercase tracking-wide text-dhl-gray-500 dark:text-dhl-gray-400">Receipt status</p><p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-dhl-black dark:text-white">{receipt.stamped ? <><BadgeCheck className="h-4 w-4 text-emerald-600" /> {receipt.stampLabel || 'Marked as stamped'}</> : <><ShieldCheck className="h-4 w-4 text-dhl-gray-400" /> Not marked as stamped</>}</p></div>
                      {receipt.signature && <div><p className="text-[11px] font-semibold uppercase tracking-wide text-dhl-gray-500 dark:text-dhl-gray-400">Receipt signature</p><p className="mt-1 text-sm font-medium text-dhl-black dark:text-white">{receipt.signature}</p></div>}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
};

export default TrackingResult;
