import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Track from './pages/Track';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/track" element={<Track />} />
      <Route path="/track/:trackingCode" element={<Track />} />
    </Routes>
  );
}

export default App;
