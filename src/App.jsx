import React, { useState } from 'react';
import { RouterProvider, useRouter } from './router/RouterContext';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Promise from './components/Promise';
import Services from './components/Services';
import Brands from './components/Brands';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import BlogList from './components/BlogList';
import BlogPostDetail from './components/BlogPostDetail';
import './App.css';

function MainAppContent() {
  const { routeType } = useRouter();
  const [isLightMode, setIsLightMode] = useState(false);

  // Active light mode is only valid when on the home page
  const activeLightMode = routeType === 'home' && isLightMode;

  return (
    <div className={`site-wrapper ${activeLightMode ? 'theme-light' : ''}`}>
      {/* 1.1s Preloader: CITYREACH in white on black */}
      <Preloader />

      {/* Glassmorphic Navbar: Adapts smoothly to global Black & White transitions */}
      <Navbar isLightMode={activeLightMode} />

      {/* Floating Black & White WhatsApp Button for Phone */}
      <WhatsAppButton />

      {/* Render based on current Route */}
      {routeType === 'home' ? (
        <>
          {/* Fixed Hero Stage: Video stays anchored in place */}
          <Hero />

          {/* Unified Content Curtain Layer: Transforms globally as user scrolls */}
          <div className={`content-curtain-layer ${activeLightMode ? 'theme-light' : ''}`}>
            {/* Section 01: Who Are We (Black) */}
            <Promise />

            {/* Section 02: Our Services (Transforms whole website from Black to White) */}
            <Services onThemeChange={setIsLightMode} />

            {/* Section 03: Brands We've Worked With (Transforms website back to Black) */}
            <Brands onThemeChange={setIsLightMode} />

            {/* Section 04: Footer (Transforms website to White again) */}
            <Footer onThemeChange={setIsLightMode} />
          </div>
        </>
      ) : routeType === 'blog_detail' ? (
        <div className="blog-route-wrapper">
          <BlogPostDetail />
          <Footer onThemeChange={() => {}} />
        </div>
      ) : (
        /* Blog List (for /in/blog, /ae/blog, /blog, /in, /ae) */
        <div className="blog-route-wrapper">
          <BlogList />
          <Footer onThemeChange={() => {}} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <MainAppContent />
    </RouterProvider>
  );
}
