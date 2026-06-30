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
    
    // Try to find a premium or native Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const idVoices = voices.filter(v => v.lang.startsWith('id') || v.lang.toLowerCase().includes('indonesia'));
    
    // Sort to prioritize natural/neural/online/Google premium voices
    idVoices.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aScore = (aName.includes('natural') ? 10 : 0) + 
                     (aName.includes('neural') ? 10 : 0) + 
                     (aName.includes('google') ? 8 : 0) + 
                     (aName.includes('online') ? 5 : 0);
                     
      const bScore = (bName.includes('natural') ? 10 : 0) + 
                     (bName.includes('neural') ? 10 : 0) + 
                     (bName.includes('google') ? 8 : 0) + 
                     (bName.includes('online') ? 5 : 0);
                     
      return bScore - aScore;
    });

    if (idVoices.length > 0) {
      utterance.voice = idVoices[0];
    }
    
    utterance.rate = 1.0; // Normal human reading speed
    utterance.pitch = 1.0; // Natural voice pitch (avoids the squeaky AI/robot effect)
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  };

  // Sync dyslexia and baseSize styling directly to the body tag (safe from position: fixed issues)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    
    if (dyslexia) {
      body.classList.add('dyslexia-font');
    } else {
      body.classList.remove('dyslexia-font');
    }

    body.style.fontSize = `${baseSize}%`;
  }, [dyslexia, baseSize]);

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
