import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, MapPin, Clock } from 'lucide-react';
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
    <section id="services" className="relative py-24 bg-dhl-gray-50 dark:bg-dhl-gray-900 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #FFCC00 0, #FFCC00 2px, transparent 2px, transparent 20px, #D40511 20px, #D40511 22px, transparent 22px, transparent 40px)'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Tracking Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/20 dark:bg-dhl-yellow/10 border-l-4 border-dhl-yellow mb-6">
              <span className="text-dhl-yellow font-bold uppercase tracking-wider text-sm">
                Real-Time Tracking
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-dhl-black dark:text-white uppercase mb-4">
              Track Your <span className="text-dhl-red">Package</span>
            </h2>

            <p className="text-lg text-dhl-gray-600 dark:text-dhl-gray-300 mb-8">
              Enter your tracking code to get real-time updates on your delivery status, 
              current location, and estimated arrival time.
            </p>

            <form onSubmit={handleTrack} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dhl-gray-400" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Enter tracking code (e.g., DXT-8F3K9L2)"
                  className="input-dhl pl-12 text-lg uppercase font-bold"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-dhl w-full flex items-center justify-center gap-2"
              >
                Track Now
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </form>

            <p className="mt-4 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">
              Need help? Contact us at <a href="mailto:dhld5736@gmail.com" className="text-dhl-red font-bold hover:underline">dhld5736@gmail.com</a> or <a href="https://t.me/Dhl5788" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold hover:underline">Telegram @Dhl5788</a>
            </p>
          </motion.div>

          {/* Right - Image & Features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80"
              alt="Package Tracking"
              className="rounded-sm shadow-2xl w-full"
            />
            
            {/* Floating cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -left-4 bg-white dark:bg-dhl-gray-800 p-4 rounded-sm shadow-xl border-l-4 border-dhl-yellow"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-dhl-red" />
                <div>
                  <div className="text-sm font-bold text-dhl-black dark:text-white">Live Location</div>
                  <div className="text-xs text-dhl-gray-500">GPS Precision</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -bottom-4 -right-4 bg-white dark:bg-dhl-gray-800 p-4 rounded-sm shadow-xl border-l-4 border-dhl-red"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-dhl-yellow" />
                <div>
                  <div className="text-sm font-bold text-dhl-black dark:text-white">ETA Updates</div>
                  <div className="text-xs text-dhl-gray-500">Every 5 Minutes</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrackingSection;
