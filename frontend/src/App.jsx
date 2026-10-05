import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Track from './pages/Track';
import Services from './pages/Services';
import Security from './pages/Security';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-dhl-gray-900 transition-colors duration-300">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/security" element={<Security />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:trackingCode" element={<Track />} />
      </Routes>
    </div>
  );
}

export default App;
