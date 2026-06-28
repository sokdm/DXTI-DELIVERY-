import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Package, Clock, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { icon: Package, value: '50K+', label: 'Deliveries' },
  { icon: Globe, value: '120+', label: 'Countries' },
  { icon: Clock, value: '99.9%', label: 'On Time' },
  { icon: Shield, value: '100%', label: 'Secure' },
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-dhl-gray-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80"
          alt="DXTI Delivery Fleet"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dhl-gray-900 via-dhl-gray-900/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dhl-gray-900 via-transparent to-dhl-gray-900/50"></div>
      </div>

      {/* Yellow diagonal accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-dhl-yellow/10 transform skew-x-12 translate-x-20"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/20 border-l-4 border-dhl-yellow mb-6">
                <span className="text-dhl-yellow font-bold uppercase tracking-wider text-sm">
                  Global Logistics Leader
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-tight mb-6">
                Fast, Secure,
                <span className="block text-dhl-yellow">Reliable</span>
                Delivery
              </h1>

              <p className="text-xl text-dhl-gray-300 mb-8 max-w-lg leading-relaxed">
                Track your packages in real-time with our advanced logistics platform. 
                Global coverage, instant updates, complete transparency.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
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
                <Link to="#services">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-dhl-outline"
                  >
                    Learn More
                  </motion.button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="text-center"
                  >
                    <stat.icon className="w-8 h-8 text-dhl-yellow mx-auto mb-2" />
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-sm text-dhl-gray-400 uppercase tracking-wider">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right side - Image showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"
                alt="DXTI Air Freight"
                className="rounded-sm shadow-2xl border-4 border-dhl-yellow/30"
              />
              <div className="absolute -bottom-6 -left-6 bg-dhl-yellow p-4 rounded-sm shadow-xl">
                <div className="text-dhl-black font-black text-lg uppercase">Express</div>
                <div className="text-dhl-red font-bold text-sm uppercase tracking-wider">1-4 Days</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-dhl-red text-white p-3 rounded-sm shadow-xl">
                <div className="font-black text-sm uppercase tracking-wider">24/7</div>
                <div className="text-xs font-bold">Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom yellow stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-dhl-red via-dhl-yellow to-dhl-red"></div>
    </section>
  );
};

export default Hero;
