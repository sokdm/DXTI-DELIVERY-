import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MessageCircle, Clock, Copy, Check } from 'lucide-react';

const Support = () => {
  const [copied, setCopied] = useState(false);
  const [showNumber, setShowNumber] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const supportItems = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      title: 'WhatsApp',
      subtitle: 'Chat with us instantly',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      action: 'https://wa.me/2348050232564',
      number: '+234 805 023 2564',
      type: 'link'
    },
    {
      id: 'phone',
      icon: Phone,
      title: 'Phone',
      subtitle: 'Call our hotline',
      color: 'from-dxt-primary to-dxt-secondary',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      action: 'tel:+2348050232564',
      number: '+234 805 023 2564',
      type: 'link'
    },
    {
      id: 'email',
      icon: Mail,
      title: 'Email',
      subtitle: 'Send us a message',
      color: 'from-dxt-secondary to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      action: 'mailto:dhld5736@gmail.com',
      email: 'dhld5736@gmail.com',
      type: 'email'
    }
  ];

  return (
    <section id="contact" className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Need <span className="gradient-text">Help?</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Our support team is available 24/7 to assist you
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {supportItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {item.type === 'link' ? (
                <a
                  href={item.action}
                  className="block glass-card p-8 text-center cursor-pointer hover:scale-105 transition-transform duration-300"
                >
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {item.subtitle}
                  </p>
                  
                  {/* Hidden number - shown on tap/hover */}
                  <div className="relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-mono text-slate-700 dark:text-slate-300">
                        {item.number}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
                      <span className="text-sm text-dxt-primary font-medium flex items-center gap-1">
                        Tap to {item.id === 'whatsapp' ? 'chat' : 'call'}
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </motion.span>
                      </span>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="glass-card p-8 text-center">
                  <a
                    href={item.action}
                    className="block cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      {item.subtitle}
                    </p>
                  </a>
                  
                  {/* Email with copy button */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                      {item.email}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.email)}
                      className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-dxt-primary hover:text-white transition-colors"
                      title="Copy email"
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Copy className="w-4 h-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Availability */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400"
        >
          <Clock className="w-5 h-5" />
          <span>Available 24/7 - All days including weekends and holidays</span>
        </motion.div>
      </div>
    </section>
  );
};

export default Support;
