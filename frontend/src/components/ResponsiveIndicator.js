import React, { useState, useEffect } from 'react';
import './ResponsiveIndicator.css';

const ResponsiveIndicator = () => {
  const [screenSize, setScreenSize] = useState('');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setScreenSize('📱 Móvil Pequeño');
      } else if (width <= 768) {
        setScreenSize('📱 Móvil');
      } else if (width <= 1024) {
        setScreenSize('📟 Tablet');
      } else {
        setScreenSize('🖥️ Desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return (
    <div className="responsive-indicator">
      <span>{screenSize}</span>
      <small>{window.innerWidth}px</small>
    </div>
  );
};

export default ResponsiveIndicator;