import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, FileCheck2, LockKeyhole, MailCheck, QrCode, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const controls = [
  { icon: LockKeyhole, title: 'Protected Admin', text: 'Admin actions remain behind authenticated access for creating, editing, stamping, emailing, and deleting packages.' },
  { icon: FileCheck2, title: 'Receipt Integrity', text: 'TRX receipts include receipt IDs, QR tracking, dispatch state, route details, signature, and stamp metadata.' },
  { icon: MailCheck, title: 'Professional Mail Flow', text: 'Customer emails include branded HTML, plain-text fallback, unsubscribe metadata, and support identity.' },
  { icon: QrCode, title: 'QR Verification', text: 'Receipt QR codes point customers back to the live tracking record for shipment status and route information.' },
];

const Security = () => (
  <div className="min-h-screen bg-white dark:bg-dhl-gray-900">
    <Navbar />
    <main className="pt-20">
      <section className="bg-dhl-black text-white py-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[.9fr_1.1fr] gap-12 items-center">
          <div>
            <div className="text-dhl-yellow font-black uppercase tracking-widest text-sm mb-5">Trust and verification</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight mb-6">Shipment proof customers can inspect</h1>
            <p className="text-xl text-dhl-gray-300 leading-relaxed">
              TRX is designed around proof: verified receipts, trackable QR records, dispatch emails, stop reason notices, and admin-controlled shipment changes.
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 p-8">
            <ShieldCheck className="w-16 h-16 text-dhl-yellow mb-6" />
            <h2 className="text-3xl font-black uppercase mb-4">TRX verification layer</h2>
            <p className="text-dhl-gray-300 leading-relaxed">
              Every operational document is built to support customer service, internal review, and shipment accountability from intake to delivery.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-dhl-gray-50 dark:bg-dhl-gray-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {controls.map((control, index) => (
            <motion.article
              key={control.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-dhl-gray-800 p-6 border border-dhl-gray-200 dark:border-dhl-gray-700"
            >
              <control.icon className="w-9 h-9 text-dhl-red mb-5" />
              <h2 className="text-xl font-black uppercase text-dhl-black dark:text-white mb-3">{control.title}</h2>
              <p className="text-dhl-gray-600 dark:text-dhl-gray-300 leading-relaxed text-sm">{control.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 bg-white dark:bg-dhl-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-dhl-red font-black uppercase tracking-widest text-sm mb-4">Deliverability note</div>
          <h2 className="text-4xl font-black uppercase text-dhl-black dark:text-white mb-5">How to keep TRX emails trusted</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {['Use a TRX domain email in Render SMTP settings', 'Configure SPF, DKIM, and DMARC records with your mail provider', 'Keep subject lines specific to each tracking code'].map((item) => (
              <div key={item} className="border-l-4 border-dhl-yellow bg-dhl-gray-50 dark:bg-dhl-gray-900 p-5">
                <BadgeCheck className="w-6 h-6 text-dhl-yellow mb-3" />
                <p className="font-bold text-dhl-black dark:text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Security;
