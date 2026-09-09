import React, { useState } from 'react';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Promise from './components/Promise';
import Services from './components/Services';
import Brands from './components/Brands';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import './App.css';

export default function App() {
  const [isLightMode, setIsLightMode] = useState(false);

  return (
    <div className={`site-wrapper ${isLightMode ? 'theme-light' : ''}`}>
      {/* 1.1s Preloader: CITYREACH in white on black */}
      <Preloader />

      {/* Glassmorphic Navbar: Adapts smoothly to global Black & White transitions */}
      <Navbar isLightMode={isLightMode} />
      
      {/* Fixed Hero Stage: Video stays anchored in place */}
      <Hero />

      {/* Floating Black & White WhatsApp Button for Phone */}
      <WhatsAppButton />

      {/* Unified Content Curtain Layer: Transforms globally as user scrolls */}
      <div className={`content-curtain-layer ${isLightMode ? 'theme-light' : ''}`}>
        {/* Section 01: Who Are We (Black) */}
        <Promise />

        {/* Section 02: Our Services (Transforms whole website from Black to White) */}
        <Services onThemeChange={setIsLightMode} />

        {/* Section 03: Brands We've Worked With (Transforms website back to Black) */}
        <Brands onThemeChange={setIsLightMode} />

        {/* Section 04: Footer (Transforms website to White again) */}
        <Footer onThemeChange={setIsLightMode} />
      </div>
    </div>
  );
}
