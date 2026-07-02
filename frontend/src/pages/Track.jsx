import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Loader2, PackageX, Truck, Mail, Send } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrackingResult from '../components/TrackingResult';

// ✅ HARDCODED: Use deployed backend URL directly
const API_URL = 'https://dxti-delivery-unhl.onrender.com/api';

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
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-dhl-gray-600 dark:text-dhl-gray-300 hover:text-dhl-yellow font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dhl-gray-900 p-8 mb-8 rounded-sm shadow-lg border-t-4 border-dhl-yellow"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-dhl-yellow rounded-sm">
                <Truck className="w-6 h-6 text-dhl-black" />
              </div>
              <h1 className="text-3xl font-black text-dhl-black dark:text-white uppercase">
                Track Your <span className="text-dhl-red">Package</span>
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="flex gap-4">
                <div className="relative flex-1">
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
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-dhl flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Track <Search className="w-5 h-5" /></>}
                </motion.button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">
              <span>Need help?</span>
              <a href="https://t.me/Dhl5788" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 font-bold hover:underline">
                <Send className="w-4 h-4" /> Telegram @Dhl5788
              </a>
              <span>or</span>
              <a href="mailto:dhld5736@gmail.com" className="inline-flex items-center gap-1 text-dhl-red font-bold hover:underline">
                <Mail className="w-4 h-4" /> dhld5736@gmail.com
              </a>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-dhl-yellow animate-spin mb-4" />
                <p className="text-dhl-gray-600 dark:text-dhl-gray-300 font-bold uppercase tracking-wider">Tracking your package...</p>
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
