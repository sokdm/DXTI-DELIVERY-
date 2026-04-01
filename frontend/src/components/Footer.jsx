import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-dxt-primary to-dxt-secondary rounded-xl">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">
                DXTI DELIVERY
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-sm">
              Your trusted partner for fast, secure, and reliable global delivery services. 
              Track your packages in real-time, anywhere in the world.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-dxt-primary hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Track Package', 'Services', 'About Us', 'Contact'].map((link) => (
                <li key={link}>
                  <Link
                    to={link === 'Home' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`}
                    className="text-slate-600 dark:text-slate-300 hover:text-dxt-primary transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Services</h4>
            <ul className="space-y-2">
              {['Express Delivery', 'Standard Shipping', 'Freight Service', 'Warehousing', 'Last Mile Delivery'].map((service) => (
                <li key={service}>
                  <span className="text-slate-600 dark:text-slate-300">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2024 DXTI Delivery. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-dxt-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-dxt-primary">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
