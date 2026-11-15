import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BellRing, ClipboardCheck, MapPin, PackageCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import TrackingSection from '../components/TrackingSection';
import Support from '../components/Support';
import Footer from '../components/Footer';

const steps = [
  {
    icon: PackageCheck,
    number: '01',
    title: 'Find your shipment',
    text: 'Enter the tracking number provided with your shipment confirmation.',
  },
  {
    icon: ClipboardCheck,
    number: '02',
    title: 'Review recorded events',
    text: 'See the current shipment status and the updates associated with the record.',
  },
  {
    icon: MapPin,
    number: '03',
    title: 'Check available details',
    text: 'Location, receipt and package information appear when they are available for the shipment.',
  },
];

const Home = () => (
  <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-dhl-gray-900">
    <Navbar />
    <main>
      <Hero />
      <TrackingSection />

      <section className="overflow-hidden bg-dhl-black py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45 }}>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-teal-300">
                <BellRing className="h-4 w-4" /> How tracking works
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Simple steps. <span className="text-teal-300">Clear updates.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                Look up the shipment record to see the latest information available from TRX Logistics.
              </p>
              <Link to="/track" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 transition hover:text-teal-200">
                Go to shipment tracking <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <div className="space-y-3">
              {steps.map(({ icon: Icon, number, title, text }, index) => (
                <motion.div key={number} initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .4, delay: index * .07 }} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:gap-5 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-300/10 text-teal-300"><Icon className="h-5 w-5" /></span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-white">{title}</h3>
                      <span className="text-xs font-bold tracking-widest text-slate-500">{number}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Features />
      <Support />
    </main>
    <Footer />
  </div>
);

export default Home;
