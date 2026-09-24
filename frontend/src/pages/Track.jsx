import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Loader2, PackageX, Truck, Mail, Send, MapPin, ShieldCheck, Clock3, Radio } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrackingResult from '../components/TrackingResult';

// ✅ HARDCODED: Use deployed backend URL directly
const API_URL = 'https://dxti-delivery-unhl.onrender.com/api';

const trustItems = [
  { icon: Radio, label: 'Live scan updates' },
  { icon: MapPin, label: 'Route map visibility' },
  { icon: Clock3, label: 'Timeline history' },
  { icon: ShieldCheck, label: 'Secure package records' },
];

const Track = () => {
  const { trackingCode: urlTrackingCode } = useParams();
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState(urlTrackingCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [packageData, setPackageData] = useState(null);

  const trackPackage = async (code) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setPackageData(null);

    try {
      const response = await axios.get(`${API_URL}/packages/track/${code.trim()}`);
      if (response.data.success) setPackageData(response.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Package not found. Please check the tracking code and try again.');
      } else if (err.response?.status === 0 || !err.response) {
        setError('Cannot connect to server. Please check your internet connection or try again later.');
      } else {
        setError(err.response?.data?.message || 'Failed to track package. Please check the tracking code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTrackingCode) trackPackage(urlTrackingCode);
  }, [urlTrackingCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      navigate(`/track/${trackingCode.trim()}`);
      trackPackage(trackingCode);
    }
  };

  return (
    <div className="min-h-screen bg-dhl-gray-50 dark:bg-dhl-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="pt-20 pb-12">
        <section className="relative overflow-hidden bg-dhl-gray-950 px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="absolute inset-0">
            <img src="/dhl-fleet.jpg" alt="DHL fleet" className="h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-r from-dhl-gray-950 via-dhl-gray-950/90 to-dhl-gray-950/55"></div>
          </div>
          <div className="relative max-w-6xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
              className="mb-8 flex items-center gap-2 text-dhl-gray-300 hover:text-dhl-yellow font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-[1fr_.75fr] gap-8 items-end"
          >
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/15 border-l-4 border-dhl-yellow mb-6">
                  <Truck className="w-4 h-4 text-dhl-yellow" />
                  <span className="text-dhl-yellow font-black uppercase tracking-wider text-sm">Shipment visibility</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight mb-5">
                  Track every movement with confidence
                </h1>
                <p className="text-lg text-dhl-gray-300 max-w-2xl leading-relaxed">
                  Enter your tracking number to view status, package details, current location, route map,
                  delivery progress, and the latest admin updates.
                </p>
              </div>

              <div className="bg-white p-5 shadow-2xl border-t-4 border-dhl-yellow">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dhl-gray-400" />
                      <input
                        type="text"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                        placeholder="Enter tracking code"
                        className="input-dhl pl-12 text-lg uppercase font-black"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-dhl w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Track Package <Search className="w-5 h-5" /></>}
                    </motion.button>
                  </div>
                </form>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {trustItems.map((item) => (
                    <div key={item.label} className="bg-dhl-gray-50 p-3">
                      <item.icon className="w-5 h-5 text-dhl-red mb-2" />
                      <div className="text-xs font-black uppercase text-dhl-gray-700 leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-dhl-gray-300">
              <span>Need help?</span>
              <a href="https://t.me/Dhl5788" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 font-bold hover:underline">
                <Send className="w-4 h-4" /> Telegram @Dhl5788
              </a>
              <span>or</span>
              <a href="mailto:dhld5736@gmail.com" className="inline-flex items-center gap-1 text-dhl-red font-bold hover:underline">
                <Mail className="w-4 h-4" /> dhld5736@gmail.com
              </a>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-dhl-gray-900 shadow-lg border-t-4 border-dhl-yellow flex flex-col items-center justify-center py-20">
                <div className="relative mb-5">
                  <Loader2 className="w-14 h-14 text-dhl-yellow animate-spin" />
                  <Truck className="w-6 h-6 text-dhl-red absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-dhl-gray-700 dark:text-dhl-gray-300 font-black uppercase tracking-wider">Checking shipment network...</p>
                <p className="text-sm text-dhl-gray-500 mt-2">Fetching map, timeline, status, and package details.</p>
              </motion.div>
            )}

            {error && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-dhl-gray-900 p-12 text-center rounded-sm shadow-lg border-t-4 border-dhl-red">
                <div className="w-20 h-20 mx-auto mb-6 bg-dhl-red/10 flex items-center justify-center">
                  <PackageX className="w-10 h-10 text-dhl-red" />
                </div>
                <h3 className="text-xl font-black text-dhl-black dark:text-white uppercase mb-2">Package Not Found</h3>
                <p className="text-dhl-gray-600 dark:text-dhl-gray-300 max-w-md mx-auto mb-6">{error}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a href="https://t.me/Dhl5788" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-blue-600 transition-colors">
                    <Send className="w-4 h-4" /> Telegram Support
                  </a>
                  <a href="mailto:dhld5736@gmail.com" className="inline-flex items-center gap-2 px-6 py-3 bg-dhl-yellow text-dhl-black font-bold uppercase tracking-wider rounded-sm hover:bg-dhl-yellow-light transition-colors">
                    <Mail className="w-4 h-4" /> Email Support
                  </a>
                </div>
              </motion.div>
            )}

            {packageData && !loading && <TrackingResult key="result" packageData={packageData} />}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Track;
