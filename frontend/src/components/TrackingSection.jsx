import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, CheckCircle2, FileCheck2, MapPin, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TrackingSection = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (event) => {
    event.preventDefault();
    const code = trackingCode.trim();
    if (code) navigate(`/track/${encodeURIComponent(code)}`);
  };

  return (
    <section id="tracking" className="relative overflow-hidden bg-dhl-gray-50 py-20 dark:bg-dhl-gray-900 sm:py-28">
      <div className="absolute -right-36 -top-32 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl dark:bg-teal-900/20" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_.85fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45 }}>
          <div className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-dhl-red" /> Shipment lookup</div>
          <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight text-dhl-black dark:text-white sm:text-5xl">
            Your shipment, <span className="text-dhl-red">clearly in view.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-dhl-gray-600 dark:text-dhl-gray-300 sm:text-lg">
            Enter the tracking number from your shipment confirmation to view its latest recorded status and history.
          </p>

          <form onSubmit={handleTrack} className="mt-8 max-w-2xl rounded-2xl border border-dhl-gray-200 bg-white p-2 shadow-xl shadow-slate-900/[.06] dark:border-dhl-gray-700 dark:bg-dhl-gray-800 sm:flex">
            <label htmlFor="homepage-tracking-code" className="sr-only">Tracking number</label>
            <div className="flex min-w-0 flex-1 items-center px-3">
              <Search className="mr-3 h-5 w-5 shrink-0 text-dhl-gray-400" />
              <input
                id="homepage-tracking-code"
                type="text"
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
                placeholder="Enter your tracking number"
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm font-medium text-dhl-black outline-none placeholder:text-dhl-gray-400 focus:ring-0 dark:text-white"
                required
              />
            </div>
            <button type="submit" className="btn-dhl mt-2 w-full !rounded-xl sm:mt-0 sm:w-auto">
              Track shipment <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-4 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">
            Questions? <a href="mailto:support@trxlogistics.com" className="font-semibold text-dhl-red hover:underline">Contact customer support</a>
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45, delay: .08 }} className="relative">
          <div className="overflow-hidden rounded-[1.75rem] bg-dhl-black p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-300">Tracking workspace</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">Every update, in context.</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">View the shipment record, its latest status and the events added along the way.</p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal-300">
                <MapPin className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-8 space-y-3">
              {[
                { icon: CheckCircle2, title: 'Status and event history', description: 'Updates recorded for your shipment' },
                { icon: MapPin, title: 'Location details', description: 'Coordinates and checkpoint details when available' },
                { icon: FileCheck2, title: 'Shipment information', description: 'Review the details linked to your tracking number' },
              ].map(({ icon: Icon, title, description }, index) => (
                <div key={title} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.045] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">0{index + 1}</span>
                </div>
              ))}
            </div>
            <Link to="/services" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 transition hover:text-teal-200">
              Explore shipment services <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="absolute -bottom-4 -left-4 -z-10 h-24 w-24 rounded-3xl bg-dhl-yellow/70" />
        </motion.div>
      </div>
    </section>
  );
};

export default TrackingSection;
