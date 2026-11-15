import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail, PackageSearch, Search, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrackingResult from '../components/TrackingResult';

const API_URL = 'https://dxti-delivery-3.onrender.com/api';

const Track = () => {
  const { trackingCode: urlTrackingCode } = useParams();
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState(urlTrackingCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [lookupCount, setLookupCount] = useState(0);

  useEffect(() => {
    if (!urlTrackingCode?.trim()) {
      setLoading(false);
      setError('');
      setPackageData(null);
      return undefined;
    }

    const controller = new AbortController();
    const code = urlTrackingCode.trim().toUpperCase();
    setTrackingCode(code);
    setLoading(true);
    setError('');
    setPackageData(null);

    axios.get(`${API_URL}/packages/track/${encodeURIComponent(code)}`, { signal: controller.signal })
      .then((response) => {
        if (response.data?.success && response.data.data) {
          setPackageData(response.data.data);
        } else {
          setError(response.data?.message || 'We could not find a shipment with that tracking number.');
        }
      })
      .catch((requestError) => {
        if (axios.isCancel(requestError)) return;
        if (requestError.response?.status === 404) {
          setError('We could not find a shipment with that tracking number. Check the code and try again.');
        } else if (!requestError.response) {
          setError('We could not connect to the tracking service. Check your connection and try again.');
        } else {
          setError(requestError.response.data?.message || 'The shipment could not be loaded. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [urlTrackingCode, lookupCount]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!code) {
      setError('Enter the tracking number from your shipment confirmation.');
      return;
    }
    const nextPath = `/track/${encodeURIComponent(code)}`;
    if (urlTrackingCode === code) {
      setLookupCount((count) => count + 1);
    } else {
      navigate(nextPath);
    }
  };

  return (
    <div className="min-h-screen bg-dhl-gray-50 dark:bg-dhl-gray-900">
      <Navbar />
      <main className="pb-20 pt-[76px]">
        <section className="relative overflow-hidden bg-dhl-black px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
          <div className="absolute inset-0 opacity-25">
            <img src="/dhl-fleet.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-dhl-black via-dhl-black/80 to-dhl-black/55" />
          </div>
          <div className="relative mx-auto max-w-7xl">
            <button type="button" onClick={() => navigate('/')} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </button>
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_.72fr]">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-teal-300"><PackageSearch className="h-4 w-4" /> TRX shipment tracking</p>
                <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Shipment updates, in one place.</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Enter your tracking number to view the shipment details and updates recorded for your package.</p>
              </motion.div>

              <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: .07 }} onSubmit={handleSubmit} className="rounded-2xl border border-white/15 bg-white p-2.5 shadow-2xl shadow-black/20 dark:bg-dhl-gray-800">
                <label htmlFor="tracking-code" className="sr-only">Tracking number</label>
                <div className="flex items-center px-3">
                  <Search className="mr-3 h-5 w-5 shrink-0 text-dhl-gray-400" />
                  <input
                    id="tracking-code"
                    type="text"
                    value={trackingCode}
                    onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
                    placeholder="Enter tracking number"
                    autoComplete="off"
                    required
                    className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm font-semibold text-dhl-black outline-none placeholder:text-dhl-gray-400 focus:ring-0 dark:text-white"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-dhl w-full !rounded-xl disabled:cursor-wait disabled:opacity-70">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking shipment</> : <>Track shipment <ArrowRight className="h-4 w-4" /></>}
                </button>
              </motion.form>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-300" /> Use the number from your confirmation</span>
              <a href="mailto:support@trxlogistics.com" className="inline-flex items-center gap-2 transition hover:text-white"><Mail className="h-4 w-4 text-teal-300" /> Contact support</a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="status" className="rounded-2xl border border-dhl-gray-200 bg-white px-6 py-16 text-center dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-dhl-red" />
                <p className="mt-4 font-semibold text-dhl-black dark:text-white">Looking up your shipment</p>
                <p className="mt-1 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">This may take a moment.</p>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 dark:border-rose-900/50 dark:bg-dhl-gray-800 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"><AlertCircle className="h-5 w-5" /></span>
                <h2 className="mt-5 text-lg font-semibold text-dhl-black dark:text-white">{urlTrackingCode ? 'Shipment lookup unsuccessful' : 'Enter a tracking number'}</h2>
                <p className="mt-2 text-sm leading-6 text-dhl-gray-600 dark:text-dhl-gray-300">{error}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm">
                  <a href="mailto:support@trxlogistics.com" className="font-semibold text-dhl-red hover:underline">Email support</a>
                  <a href="https://t.me/TRXLogistics" target="_blank" rel="noopener noreferrer" className="font-semibold text-dhl-red hover:underline">Telegram support</a>
                </div>
              </motion.div>
            )}

            {!loading && !error && !packageData && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dhl-gray-200 bg-white p-6 dark:border-dhl-gray-700 dark:bg-dhl-gray-800 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300"><PackageSearch className="h-6 w-6" /></span>
                  <div className="flex-1">
                    <h2 className="font-semibold text-dhl-black dark:text-white">Ready when you are</h2>
                    <p className="mt-1 text-sm leading-6 text-dhl-gray-500 dark:text-dhl-gray-400">Enter a tracking number above to open its shipment record and available status history.</p>
                  </div>
                  <a href="mailto:support@trxlogistics.com" className="inline-flex items-center gap-2 text-sm font-semibold text-dhl-red hover:underline">Need help? <ArrowRight className="h-4 w-4" /></a>
                </div>
              </motion.div>
            )}

            {!loading && packageData && <TrackingResult key={`result-${packageData.trackingCode}`} packageData={packageData} />}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Track;
