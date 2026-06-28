import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Clock, MapPin, Headphones, Send, ExternalLink } from 'lucide-react';

const contactMethods = [
  {
    icon: Send,
    title: 'Telegram',
    description: 'Chat with us on Telegram',
    action: '@Dhl5788',
    href: 'https://t.me/Dhl5788',
    color: 'bg-blue-500',
    textColor: 'text-white',
    available: '24/7',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'Send us an email',
    action: 'dhld5736@gmail.com',
    href: 'mailto:dhld5736@gmail.com',
    color: 'bg-dhl-yellow',
    textColor: 'text-dhl-black',
    available: '24/7',
  },
];

const Support = () => {
  return (
    <section id="contact" className="relative py-24 bg-dhl-gray-900 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&q=80"
          alt="Support Team"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dhl-gray-900 via-dhl-gray-900/90 to-dhl-gray-900"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/20 border-l-4 border-dhl-yellow mb-6">
            <span className="text-dhl-yellow font-bold uppercase tracking-wider text-sm">
              24/7 Support
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-4">
            Need <span className="text-dhl-yellow">Help?</span>
          </h2>
          <p className="text-lg text-dhl-gray-300 max-w-2xl mx-auto">
            Our support team is available 24/7 to assist you with any questions or concerns.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {contactMethods.map((method, index) => (
            <motion.a
              key={method.title}
              href={method.href}
              target={method.title === 'Telegram' ? '_blank' : undefined}
              rel={method.title === 'Telegram' ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="block bg-white/10 backdrop-blur-lg border border-white/20 rounded-sm p-8 text-center hover:bg-white/20 transition-all duration-300 group"
            >
              <div className={`w-16 h-16 ${method.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                <method.icon className={`w-8 h-8 ${method.textColor}`} />
              </div>

              <h3 className="text-xl font-black text-white uppercase mb-2">
                {method.title}
              </h3>

              <p className="text-dhl-gray-400 mb-4 text-sm">
                {method.description}
              </p>

              <div className="text-dhl-yellow font-bold text-lg mb-4">
                {method.action}
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/20 text-dhl-yellow text-sm font-bold uppercase tracking-wider rounded-sm">
                <Clock className="w-4 h-4" />
                {method.available}
              </div>

              {method.title === 'Telegram' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-dhl-gray-400 text-sm">
                  <ExternalLink className="w-4 h-4" />
                  <span>Tap to open Telegram</span>
                </div>
              )}
            </motion.a>
          ))}
        </div>

        {/* Availability Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-dhl-yellow rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Headphones className="w-10 h-10 text-dhl-black" />
            <div>
              <h3 className="text-xl font-black text-dhl-black uppercase">Available 24/7</h3>
              <p className="text-dhl-black/70 text-sm">All days including weekends and holidays</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-dhl-black font-bold">
            <MapPin className="w-5 h-5" />
            <span>Global Support Network</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Support;
