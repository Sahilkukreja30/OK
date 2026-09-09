import React, { useState, useEffect } from 'react';
import './Preloader.css';

export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1.1 seconds loader timer
    const timer = setTimeout(() => {
      setFading(true);
      // Remove from DOM after fade transition
      setTimeout(() => {
        setVisible(false);
      }, 400);
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`preloader-screen ${fading ? 'fade-out' : ''}`}>
      <div className="preloader-content">
        <h1 className="preloader-brand">CITYREACH</h1>
      </div>
    </div>
  );
}
