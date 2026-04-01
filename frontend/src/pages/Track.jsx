import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Loader2, PackageX } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrackingResult from '../components/TrackingResult';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      if (response.data.success) {
        setPackageData(response.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to track package. Please check the tracking code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTrackingCode) {
      trackPackage(urlTrackingCode);
    }
  }, [urlTrackingCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      navigate(`/track/${trackingCode.trim()}`);
      trackPackage(trackingCode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-dxt-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </motion.button>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-8"
          >
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Track Your <span className="gradient-text">Package</span>
            </h1>
            
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    placeholder="Enter tracking code (e.g., DXT-8F3K9L2)"
                    className="input-field pl-12 text-lg uppercase"
                  />
                </div>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Track
                      <Search className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-12 h-12 text-dxt-primary animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-300">Tracking your package...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <PackageX className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Package Not Found
                </h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {error}
                </p>
              </motion.div>
            )}

            {packageData && !loading && (
              <TrackingResult key="result" packageData={packageData} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Track;
