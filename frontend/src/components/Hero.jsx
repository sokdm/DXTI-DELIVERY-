import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Package, Clock, Globe, Shield, MapPin, Radio, Plane, CheckCircle2, Route, Camera, FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { icon: Package, value: '50K+', label: 'Shipments' },
  { icon: Globe, value: '120+', label: 'Countries' },
  { icon: Clock, value: '24/7', label: 'Monitoring' },
  { icon: Shield, value: 'Secure', label: 'Records' },
];

const liveCards = [
  { icon: Route, label: 'Route quality', value: 'Priority lane' },
  { icon: Camera, label: 'Location proof', value: 'Photo check' },
  { icon: FileCheck2, label: 'Docs', value: 'Receipt ready' },
];

const checkpoints = [
  { icon: CheckCircle2, label: 'Booked', tone: 'bg-green-500' },
  { icon: Radio, label: 'Live scan', tone: 'bg-dhl-yellow' },
  { icon: Plane, label: 'Air route', tone: 'bg-blue-500' },
  { icon: MapPin, label: 'Final mile', tone: 'bg-dhl-red' },
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-dhl-gray-900">
      <div className="absolute inset-0">
        <img
          src="/dhl-airplane.jpg"
          alt="DHL aircraft at an express logistics hub"
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dhl-gray-950 via-dhl-gray-900/85 to-dhl-gray-900/35"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dhl-gray-900 via-transparent to-dhl-gray-900/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 xl:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/20 border-l-4 border-dhl-yellow mb-6">
                <span className="text-dhl-yellow font-bold uppercase tracking-wider text-sm">
                  Premium express logistics
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white uppercase leading-[0.95] mb-6 max-w-3xl">
                Precision delivery with
                <span className="block text-dhl-yellow">live shipment control</span>
              </h1>

              <p className="text-lg md:text-xl text-dhl-gray-200 mb-8 max-w-2xl leading-relaxed">
                A refined delivery experience for high-value shipments, with live map tracking,
                verified package records, branded customer updates, and clear progress from pickup to final mile.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link to="/track">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-dhl flex items-center gap-2"
                  >
                    Track Package
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <a href="#services">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-dhl-outline"
                  >
                    Learn More
                  </motion.button>
                </a>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="border border-white/10 bg-white/10 backdrop-blur-md p-4 text-left"
                  >
                    <stat.icon className="w-7 h-7 text-dhl-yellow mb-3" />
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-xs text-dhl-gray-300 uppercase tracking-wider font-bold">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-md border border-white/15 p-3 shadow-2xl">
              <div className="grid grid-cols-[1.15fr_.85fr] gap-3">
                <img
                  src="/dhl-warehouse.jpg"
                  alt="Express warehouse package processing"
                  className="h-[420px] md:h-[520px] w-full object-cover"
                />
                <div className="grid gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=700&q=80"
                    alt="Premium delivery fleet"
                    className="h-full min-h-[180px] object-cover"
                  />
                  <div className="bg-dhl-yellow text-dhl-black p-5 flex flex-col justify-between">
                    <div className="text-xs font-black uppercase tracking-widest text-dhl-red">Control layer</div>
                    <div>
                      <div className="text-4xl font-black">Live</div>
                      <div className="font-black uppercase leading-tight">route intelligence</div>
                    </div>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=700&q=80"
                    alt="Courier loading packages"
                    className="h-full min-h-[180px] object-cover"
                  />
                </div>
              </div>
              <div className="absolute left-6 right-6 bottom-6 bg-dhl-gray-950/90 border-l-4 border-dhl-yellow p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-dhl-yellow text-xs font-black uppercase tracking-widest">Operations status</div>
                    <div className="text-white text-2xl font-black uppercase">Shipment in control</div>
                  </div>
                  <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {liveCards.map((item) => (
                    <div key={item.label} className="bg-white/10 p-3">
                      <item.icon className="w-4 h-4 text-dhl-yellow mb-2" />
                      <div className="text-[10px] text-dhl-gray-400 font-bold uppercase">{item.label}</div>
                      <div className="text-xs text-white font-black">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {checkpoints.map((item) => (
                    <div key={item.label} className="bg-white/10 p-3 text-center">
                      <div className={`mx-auto mb-2 h-9 w-9 ${item.tone} flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${item.tone === 'bg-dhl-yellow' ? 'text-dhl-black' : 'text-white'}`} />
                      </div>
                      <div className="text-[10px] text-dhl-gray-200 font-bold uppercase leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 right-4 bg-dhl-yellow text-dhl-black p-4 shadow-xl">
                <div className="font-black text-sm uppercase tracking-wider">Live ETA</div>
                <div className="text-dhl-red font-black text-2xl">On route</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-dhl-red via-dhl-yellow to-dhl-red"></div>
    </section>
  );
};

export default Hero;
