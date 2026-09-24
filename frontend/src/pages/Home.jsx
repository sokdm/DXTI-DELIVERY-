import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPinned, FileText, ShieldCheck, Bell, Plane, Warehouse, Truck } from 'lucide-react';
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
  { icon: FileText, title: 'Receipt-ready workflow', text: 'Admins can print, download, or email DHL-styled receipts directly from the dashboard.' },
];

const controlPoints = [
  { label: 'Admin dashboard', value: 'Protected' },
  { label: 'Tracking history', value: 'Timeline' },
  { label: 'Map visibility', value: 'Customer view' },
  { label: 'Email sender', value: 'DHL display' },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-dhl-gray-900 transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <TrackingSection />
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
