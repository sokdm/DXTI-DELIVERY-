import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, KeyRound, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const principles = [
  { icon: LockKeyhole, title: 'Operations access', text: 'Shipment creation and management are handled through the TRX Logistics admin workflow.' },
  { icon: Eye, title: 'Shipment visibility', text: 'The tracking page displays information associated with the tracking number you look up.' },
  { icon: MailCheck, title: 'Customer email updates', text: 'Shipment updates may also be sent to the email address associated with the shipment.' },
  { icon: KeyRound, title: 'API integrations', text: 'Integration credentials and permissions are managed separately from the public tracking experience.' },
];

const Security = () => (
  <div className="min-h-screen bg-white dark:bg-dhl-gray-900">
    <Navbar />
    <main className="pt-[76px]">
      <section className="relative overflow-hidden bg-dhl-black px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full border border-white/[.07]" />
        <div className="absolute -right-12 -top-12 h-80 w-80 rounded-full border border-white/[.07]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_.55fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-teal-300"><ShieldCheck className="h-4 w-4" /> Security and privacy</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Shipment information, handled with care.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              This page explains the tracking experience and the controls around shipment management. Only share your tracking number with people you trust.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-7 backdrop-blur">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-300"><ShieldCheck className="h-6 w-6" /></span>
            <h2 className="mt-5 text-xl font-semibold">Use your tracking number thoughtfully</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">A tracking number opens the shipment information made available on the public tracking page. Keep it private if you do not want others to view that record.</p>
          </div>
        </div>
      </section>

      <section className="bg-dhl-gray-50 py-20 dark:bg-dhl-gray-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">How the portal works</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-dhl-black dark:text-white sm:text-4xl">Clear information. Controlled operations.</h2>
            <p className="mt-4 leading-7 text-dhl-gray-600 dark:text-dhl-gray-300">A practical overview of how shipment details are made available and maintained.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, text }, index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .35, delay: index * .05 }} className="rounded-2xl border border-dhl-gray-200 bg-white p-6 dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-5 font-semibold text-dhl-black dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-dhl-gray-600 dark:text-dhl-gray-300">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-dhl-gray-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-dhl-black dark:text-white">Need help with a shipment?</h2>
            <p className="mt-2 text-sm text-dhl-gray-600 dark:text-dhl-gray-300">Contact support and include the tracking number if appropriate.</p>
          </div>
          <Link to="/#contact" className="btn-dhl !rounded-xl">Contact support <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Security;
