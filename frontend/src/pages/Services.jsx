import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Banknote, Boxes, Globe2, Plane, RadioTower, Route, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const services = [
  { icon: Plane, title: 'TRX Prime Global', text: 'Priority international movement for high-value parcels, documents, and business-critical freight.' },
  { icon: Banknote, title: 'Fintech Settlement Layer', text: 'Currency-aware shipment records, receipt totals, declared values, and customer-facing billing proof.' },
  { icon: ShieldCheck, title: 'Verified Receipt Control', text: 'Stamped receipts, QR tracking, signature proof, and dispatch documents attached to customer emails.' },
  { icon: Route, title: 'Route Intelligence', text: 'Origin, destination, progress, location coordinates, current photos, and timeline updates in one tracking flow.' },
  { icon: Boxes, title: 'Warehouse Command', text: 'Admin-managed intake, image replacement, stop reasons, customer notices, and operational package edits.' },
  { icon: RadioTower, title: 'Status Broadcasts', text: 'Professional status emails for created, dispatched, stopped, arrived, and delivered shipment events.' },
];

const Services = () => (
  <div className="min-h-screen bg-white dark:bg-dhl-gray-900">
    <Navbar />
    <main className="pt-20">
      <section className="relative overflow-hidden bg-dhl-gray-950 text-white py-24 px-4">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80" alt="TRX logistics operation" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-dhl-gray-950 via-dhl-gray-950/90 to-dhl-gray-950/50"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="text-dhl-yellow font-black uppercase tracking-widest text-sm mb-5">TRX service architecture</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight mb-6">Fintech logistics built for proof</h1>
            <p className="text-xl text-dhl-gray-300 leading-relaxed">
              TRX combines shipment movement, verified receipts, route intelligence, customer notifications, and admin control into one secure logistics layer.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-dhl-gray-50 dark:bg-dhl-gray-900 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-dhl-gray-800 border border-dhl-gray-200 dark:border-dhl-gray-700 p-7 border-t-4 border-dhl-yellow"
            >
              <service.icon className="w-10 h-10 text-dhl-red mb-6" />
              <h2 className="text-2xl font-black uppercase text-dhl-black dark:text-white mb-3">{service.title}</h2>
              <p className="text-dhl-gray-600 dark:text-dhl-gray-300 leading-relaxed">{service.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-dhl-black text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[.9fr_1.1fr] gap-10 items-center">
          <div>
            <div className="text-dhl-yellow font-black uppercase tracking-widest text-sm mb-4">Operational standard</div>
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-5">Every shipment leaves a record</h2>
            <p className="text-dhl-gray-300 leading-relaxed text-lg">
              From booking to dispatch and final delivery, TRX keeps the customer informed with receipt proof, status timelines, QR tracking, and support-ready shipment details.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {['Stamped receipt PDF', 'Dispatch status email', 'Stop reason notice', 'QR tracking scan'].map((item) => (
              <div key={item} className="bg-white/10 border border-white/10 p-5 flex items-center gap-3">
                <BadgeCheck className="w-6 h-6 text-dhl-yellow" />
                <span className="font-black uppercase tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-dhl-yellow">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase text-dhl-black">Ready to track a shipment?</h2>
            <p className="text-dhl-black/70 font-semibold mt-1">Use the TRX tracking page for live status, timeline, map, and receipt context.</p>
          </div>
          <Link to="/track" className="inline-flex items-center gap-2 bg-dhl-black text-white px-7 py-4 font-black uppercase tracking-wider">
            Track now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Services;
