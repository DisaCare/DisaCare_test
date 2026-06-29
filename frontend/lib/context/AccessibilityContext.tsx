'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  grayscale: boolean;
  dyslexia: boolean;
  baseSize: number;
  toggleHighContrast: () => void;
  toggleGrayscale: () => void;
  toggleDyslexia: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [baseSize, setBaseSize] = useState(100);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleGrayscale = () => setGrayscale(prev => !prev);
  const toggleDyslexia = () => setDyslexia(prev => !prev);

  const increaseFontSize = () => {
    setBaseSize(prev => Math.min(prev + 5, 130));
  };

  const decreaseFontSize = () => {
    setBaseSize(prev => Math.max(prev - 5, 80));
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any previous reading
    
    // Clean up text from HTML/Symbols if needed
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  };

  // Sync highContrast/grayscale/dyslexia/baseSize classes and style to body tag
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    if (grayscale) {
      body.classList.add('grayscale-mode');
    } else {
      body.classList.remove('grayscale-mode');
    }

    if (dyslexia) {
      body.classList.add('dyslexia-font');
    } else {
      body.classList.remove('dyslexia-font');
    }

    body.style.fontSize = `${baseSize}%`;
  }, [highContrast, grayscale, dyslexia, baseSize]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        grayscale,
        dyslexia,
        baseSize,
        toggleHighContrast,
        toggleGrayscale,
        toggleDyslexia,
        increaseFontSize,
        decreaseFontSize,
        speak,
        stopSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
