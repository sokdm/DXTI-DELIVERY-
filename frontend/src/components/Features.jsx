import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe, MapPin, Shield, Clock, Headphones } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Fast Delivery',
    description: 'Express shipping with same-day and next-day delivery options available worldwide.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Deliver to over 120 countries with our extensive international network.',
    color: 'from-blue-400 to-cyan-500',
  },
  {
    icon: MapPin,
    title: 'Real-time Tracking',
    description: 'Track your package every step of the way with GPS precision and live updates.',
    color: 'from-green-400 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'Secure Handling',
    description: 'Full insurance coverage and secure packaging for your valuable items.',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock customer service to assist you anytime, anywhere.',
    color: 'from-red-400 to-rose-500',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Personal account managers for business clients and priority handling.',
    color: 'from-indigo-400 to-violet-500',
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Why Choose <span className="gradient-text">DXTI</span>?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Experience the future of logistics with our cutting-edge technology and unmatched service quality.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass-card p-8 group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
