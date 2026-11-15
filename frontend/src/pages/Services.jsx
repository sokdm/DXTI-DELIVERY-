import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BellRing, FileText, MapPin, PackageCheck, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const services = [
  { icon: Search, title: 'Shipment lookup', text: 'Search with a tracking number to open the corresponding shipment record.' },
  { icon: PackageCheck, title: 'Status and history', text: 'Review the current status alongside the recorded events available for the shipment.' },
  { icon: MapPin, title: 'Location details', text: 'See location information and a map view when coordinates have been recorded.' },
  { icon: FileText, title: 'Shipment and receipt details', text: 'Check the package information and receipt reference included with the record.' },
  { icon: BellRing, title: 'Shipment notifications', text: 'Customer email updates can be sent when shipment changes are published by the operations team.' },
];

const Services = () => (
  <div className="min-h-screen bg-white dark:bg-dhl-gray-900">
    <Navbar />
    <main className="pt-[76px]">
      <section className="relative overflow-hidden bg-dhl-black px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute inset-0 opacity-30">
          <img src="/dhl-warehouse.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-dhl-black via-dhl-black/85 to-dhl-black/50" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">Customer services</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Everything you need to follow a shipment.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Use the TRX Logistics portal to look up shipment details and view the updates recorded for your package.
            </p>
            <Link to="/track" className="btn-dhl mt-8 !rounded-xl">Track a shipment <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-dhl-gray-50 py-20 dark:bg-dhl-gray-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Tracking portal</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-dhl-black dark:text-white sm:text-4xl">A single view for shipment information.</h2>
            <p className="mt-4 leading-7 text-dhl-gray-600 dark:text-dhl-gray-300">Information shown depends on what has been added to the shipment record.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ icon: Icon, title, text }, index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .35, delay: (index % 3) * .06 }} className="rounded-2xl border border-dhl-gray-200 bg-white p-6 dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
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
            <h2 className="text-2xl font-bold tracking-tight text-dhl-black dark:text-white">Have a tracking number?</h2>
            <p className="mt-2 text-sm text-dhl-gray-600 dark:text-dhl-gray-300">Open the shipment page to check its latest recorded updates.</p>
          </div>
          <Link to="/track" className="btn-dhl !rounded-xl">Go to tracking <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Services;
