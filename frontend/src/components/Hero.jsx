import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => (
  <section className="relative min-h-[680px] overflow-hidden bg-dhl-black pt-[76px] text-white lg:min-h-[760px]">
    <div className="absolute inset-0 lg:left-[42%]">
      <img src="/dhl-airplane.jpg" alt="" className="h-full w-full object-cover object-center opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-dhl-black via-dhl-black/60 to-dhl-black/10 lg:from-dhl-black lg:via-dhl-black/25 lg:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dhl-black/70 via-transparent to-dhl-black/10" />
    </div>
    <div className="absolute -left-48 top-32 h-[28rem] w-[28rem] rounded-full border border-white/[.06]" />
    <div className="absolute -left-32 top-48 h-80 w-80 rounded-full border border-white/[.06]" />

    <div className="relative mx-auto grid min-h-[604px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:min-h-[684px] lg:grid-cols-[1.05fr_.95fr] lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-2 text-xs font-semibold tracking-wide text-slate-200 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
          TRX Logistics shipment portal
        </div>
        <h1 className="mt-7 max-w-[650px] text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-6xl lg:text-[4.25rem]">
          A clearer view of <span className="text-teal-300">every delivery.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          Track your shipment, review recorded updates and find the details you need—all in one straightforward place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/track" className="btn-dhl !rounded-xl !px-5">
            Track a shipment <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/services" className="btn-dhl-outline !rounded-xl !px-5">
            Explore services
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
          {['Shipment event history', 'Shipment details', 'Support when you need it'].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-300/15 text-teal-300"><Check className="h-3 w-3" /></span>
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .65, delay: .12 }} className="relative hidden lg:block">
        <div className="ml-auto max-w-[490px] rounded-[1.75rem] border border-white/15 bg-white/[.08] p-3 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="relative h-[490px] overflow-hidden rounded-[1.25rem]">
            <img src="/dhl-warehouse.jpg" alt="Shipment being prepared at a logistics facility" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-dhl-black/75 via-transparent to-transparent" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/15 bg-dhl-black/75 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.17em] text-teal-300">Shipment portal</p>
                  <p className="mt-2 text-xl font-semibold">Details when you need them.</p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-300/15 text-teal-300">
                  <PackageCheck className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[.06] p-3.5">
                  <Truck className="h-4 w-4 text-slate-300" />
                  <p className="mt-3 text-xs font-semibold text-slate-200">Shipment progress</p>
                  <p className="mt-1 text-[11px] text-slate-400">From recorded updates</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[.06] p-3.5">
                  <ShieldCheck className="h-4 w-4 text-slate-300" />
                  <p className="mt-3 text-xs font-semibold text-slate-200">Shipment details</p>
                  <p className="mt-1 text-[11px] text-slate-400">Linked to your record</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-6 -left-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dhl-yellow text-dhl-black shadow-xl">
          <ArrowDown className="h-6 w-6" />
        </div>
      </motion.div>
    </div>
    <div className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-teal-300/60 to-transparent" />
  </section>
);

export default Hero;
