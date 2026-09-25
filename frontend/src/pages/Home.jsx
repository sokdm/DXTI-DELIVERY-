import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPinned, FileText, ShieldCheck, Bell, Plane, Warehouse, Truck, Camera, CreditCard, Globe2, RadioTower, LockKeyhole, Headphones } from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import TrackingSection from '../components/TrackingSection';
import Support from '../components/Support';
import Footer from '../components/Footer';

const operations = [
  { icon: Warehouse, title: 'Intake and verification', text: 'Packages are logged with sender, receiver, image, weight, route, and delivery value.' },
  { icon: Bell, title: 'Status notifications', text: 'Customers receive branded shipment and status updates when admins change package progress.' },
  { icon: MapPinned, title: 'Live route view', text: 'Tracking pages show current location, destination, movement line, facility updates, and location photos.' },
  { icon: FileText, title: 'Receipt-ready workflow', text: 'Admins can print, download, or email detailed branded receipts directly from the dashboard.' },
];

const controlPoints = [
  { label: 'Admin dashboard', value: 'Protected' },
  { label: 'Tracking history', value: 'Timeline' },
  { label: 'Map visibility', value: 'Customer view' },
  { label: 'Email sender', value: 'Branded display' },
];

const experienceTiles = [
  {
    icon: Camera,
    title: 'Photo-backed location updates',
    text: 'Attach a current-location photo so customers can open the map and see visual proof from the active checkpoint.',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&q=80',
  },
  {
    icon: CreditCard,
    title: 'Currency-aware charges',
    text: 'Create shipments with local billing country, currency code, and symbol so receipts feel native to the customer.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80',
  },
  {
    icon: RadioTower,
    title: 'Status broadcasts',
    text: 'Notify customers when a package is created, moved, held, arrived, delivered, or requires action.',
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=900&q=80',
  },
];

const trustItems = [
  { icon: LockKeyhole, title: 'Protected admin access', text: 'Dashboard actions are guarded so package data and receipts stay controlled.' },
  { icon: Globe2, title: 'International-ready', text: 'Routes, currencies, addresses, and destination details support global shipments.' },
  { icon: Headphones, title: 'Customer support flow', text: 'Tracking pages and email updates guide customers to the right shipment record.' },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-dhl-gray-900 transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <TrackingSection />
        <section className="bg-white dark:bg-dhl-gray-900 py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-12 items-end mb-12">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <div className="text-dhl-red font-black uppercase tracking-widest text-sm mb-4">Customer experience</div>
                <h2 className="text-4xl md:text-6xl font-black uppercase text-dhl-black dark:text-white leading-tight">
                  More detail at every checkpoint
                </h2>
              </motion.div>
              <p className="text-lg text-dhl-gray-600 dark:text-dhl-gray-300 leading-relaxed">
                The public site now feels like a premium shipment portal: cleaner progress, richer proof, stronger receipt detail,
                and image-led sections that make the service feel active, trustworthy, and ready for real customers.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {experienceTiles.map((item, index) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className="group bg-dhl-gray-950 text-white overflow-hidden"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dhl-gray-950 via-transparent to-transparent"></div>
                    <div className="absolute left-5 bottom-5 h-12 w-12 bg-dhl-yellow flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-dhl-black" />
                    </div>
                  </div>
                  <div className="p-7">
                    <h3 className="text-2xl font-black uppercase mb-3">{item.title}</h3>
                    <p className="text-dhl-gray-300 leading-relaxed">{item.text}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-dhl-gray-950 text-white py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/15 border-l-4 border-dhl-yellow mb-6">
                  <BarChart3 className="w-4 h-4 text-dhl-yellow" />
                  <span className="text-dhl-yellow font-black uppercase tracking-wider text-sm">Shipment control center</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight mb-5">
                  Built for serious package management
                </h2>
                <p className="text-dhl-gray-300 text-lg leading-relaxed mb-8">
                  The customer site is connected to an admin workflow for creating packages, editing shipment details,
                  replacing images, sending receipts, and publishing status updates that customers can follow in real time.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {controlPoints.map((item) => (
                    <div key={item.label} className="border border-white/10 bg-white/5 p-4">
                      <div className="text-dhl-yellow text-xl font-black">{item.value}</div>
                      <div className="text-xs text-dhl-gray-400 uppercase tracking-wider font-bold mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-5">
                {operations.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="bg-white text-dhl-black p-6 border-t-4 border-dhl-yellow shadow-xl"
                  >
                    <item.icon className="w-9 h-9 text-dhl-red mb-5" />
                    <h3 className="text-xl font-black uppercase mb-3">{item.title}</h3>
                    <p className="text-dhl-gray-600 leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <Features />
        <section className="relative bg-dhl-gray-100 dark:bg-dhl-gray-950 py-24 overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/2 hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80"
              alt="Express delivery vehicles at a logistics hub"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dhl-gray-100 dark:from-dhl-gray-950 to-transparent"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <div className="text-dhl-red font-black uppercase tracking-widest text-sm mb-4">Built for confidence</div>
              <h2 className="text-4xl md:text-5xl font-black uppercase text-dhl-black dark:text-white leading-tight mb-5">
                A sharper shipment experience from admin to customer
              </h2>
              <p className="text-dhl-gray-600 dark:text-dhl-gray-300 text-lg leading-relaxed">
                Every screen is designed to make the package feel traceable, documented, and professionally handled.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl">
              {trustItems.map((item) => (
                <div key={item.title} className="bg-white dark:bg-dhl-gray-900 p-6 border-t-4 border-dhl-yellow shadow-lg">
                  <item.icon className="w-9 h-9 text-dhl-red mb-5" />
                  <h3 className="text-xl font-black uppercase text-dhl-black dark:text-white mb-3">{item.title}</h3>
                  <p className="text-dhl-gray-600 dark:text-dhl-gray-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-dhl-yellow py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-6 items-stretch">
              {[
                { icon: Plane, title: 'Air movement', text: 'Priority route handling for international express shipments.' },
                { icon: Truck, title: 'Ground delivery', text: 'Final-mile progress shown clearly on the customer tracking page.' },
                { icon: ShieldCheck, title: 'Secure records', text: 'Receipts, tracking numbers, customer details, and package images stay organized.' },
              ].map((item) => (
                <div key={item.title} className="bg-dhl-black text-white p-7 border-b-4 border-dhl-red">
                  <item.icon className="w-10 h-10 text-dhl-yellow mb-5" />
                  <h3 className="text-2xl font-black uppercase mb-3">{item.title}</h3>
                  <p className="text-dhl-gray-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Support />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
