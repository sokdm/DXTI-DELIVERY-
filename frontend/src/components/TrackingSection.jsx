import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrackingSection = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      navigate(`/track/${trackingCode.trim()}`);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dxt-primary/5 to-dxt-secondary/5 dark:from-dxt-primary/10 dark:to-dxt-secondary/10" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 md:p-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-dxt-primary to-dxt-secondary mb-6">
            <Package className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Track Your Package
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto">
            Enter your tracking code to get real-time updates on your delivery status and location.
          </p>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Enter tracking code (e.g., DXT-8F3K9L2)"
                className="input-field pl-12"
              />
            </div>
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Track Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Example: DXT-8F3K9L2
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TrackingSection;
