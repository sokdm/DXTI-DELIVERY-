import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import TrackingSection from '../components/TrackingSection';
import Support from '../components/Support';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <TrackingSection />
        <Features />
        <Support />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
