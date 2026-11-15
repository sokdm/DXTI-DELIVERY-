import React, { useEffect } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Track from './pages/Track';
import Services from './pages/Services';
import Security from './pages/Security';

function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-dhl-gray-900">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/security" element={<Security />} />
              <Route path="/track" element={<Track />} />
              <Route path="/track/:trackingCode" element={<Track />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default App;
