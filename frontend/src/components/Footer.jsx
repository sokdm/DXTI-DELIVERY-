import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Send, Mail, ArrowUp, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Track Package', href: '/track' },
    { name: 'Services', href: '#services' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const services = [
    'Express Delivery',
    'Standard Shipping',
    'Freight Service',
    'Warehousing',
    'Last Mile Delivery',
  ];

  return (
    <footer className="relative bg-dhl-black dark:bg-dhl-gray-950 text-white overflow-hidden">
      {/* Yellow top border */}
      <div className="h-2 bg-gradient-to-r from-dhl-red via-dhl-yellow to-dhl-red"></div>

      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80"
          alt="Background"
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-dhl-yellow rounded-sm">
                <Truck className="w-6 h-6 text-dhl-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white uppercase tracking-tight leading-none">DXTI</span>
                <span className="text-xs font-bold text-dhl-yellow uppercase tracking-widest leading-none">DELIVERY</span>
              </div>
            </Link>

            <p className="text-dhl-gray-400 text-sm leading-relaxed mb-6">
              Your trusted partner for fast, secure, and reliable global delivery services. 
              Track your packages in real-time, anywhere in the world.
            </p>

            {/* Contact Buttons */}
            <div className="space-y-3">
              <a
                href="https://t.me/Dhl5788"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-sm transition-colors font-bold text-sm uppercase tracking-wider"
              >
                <Send className="w-4 h-4" />
                Telegram @Dhl5788
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="mailto:dhld5736@gmail.com"
                className="flex items-center gap-3 px-4 py-3 bg-dhl-yellow hover:bg-dhl-yellow-light text-dhl-black rounded-sm transition-colors font-bold text-sm uppercase tracking-wider"
              >
                <Mail className="w-4 h-4" />
                dhld5736@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-black uppercase mb-6 text-dhl-yellow">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-dhl-gray-400 hover:text-dhl-yellow text-sm uppercase tracking-wider transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-black uppercase mb-6 text-dhl-yellow">Services</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-dhl-gray-400 text-sm uppercase tracking-wider">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-black uppercase mb-6 text-dhl-yellow">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:dhld5736@gmail.com" 
                  className="flex items-start gap-3 group"
                >
                  <Mail className="w-5 h-5 text-dhl-yellow flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-dhl-gray-400">Email</div>
                    <span className="text-white group-hover:text-dhl-yellow transition-colors text-sm font-semibold">
                      dhld5736@gmail.com
                    </span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me/Dhl5788"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <Send className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-dhl-gray-400">Telegram</div>
                    <span className="text-white group-hover:text-blue-400 transition-colors text-sm font-semibold">
                      @Dhl5788
                    </span>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-dhl-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-dhl-gray-400">Global Network</div>
                  <span className="text-white text-sm font-semibold">120+ Countries</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-dhl-gray-500 text-sm">
            © 2024 DXTI Delivery. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-sm text-dhl-gray-500">
            <a href="#" className="hover:text-dhl-yellow transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-dhl-yellow transition-colors">Terms of Service</a>
          </div>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-dhl-yellow text-dhl-black rounded-sm hover:bg-dhl-yellow-light transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
