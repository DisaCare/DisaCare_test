'use client';

import { useState, useEffect } from 'react';
import { useAccessibility } from '../../lib/context/AccessibilityContext';

export default function AccessibilityMenu() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    highContrast,
    grayscale,
    dyslexia,
    toggleHighContrast,
    toggleGrayscale,
    toggleDyslexia,
    increaseFontSize,
    decreaseFontSize,
    speak,
  } = useAccessibility();

  const [showAccessMenu, setShowAccessMenu] = useState(false);

  const handleSpeakStatus = () => {
    speak('Menu pengaturan aksesibilitas dibuka. Anda dapat mengaktifkan kontras tinggi, mode buta warna, font readability khusus disleksia, dan memperbesar atau memperkecil teks.');
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999] select-none">
      {showAccessMenu && (
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-black/5 mb-2 w-60 animate-fade-in text-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1.5 border-b border-slate-100">
            Pengaturan Aksesibilitas
          </p>
          <button 
            onClick={toggleHighContrast}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-left cursor-pointer transition-all border ${
              highContrast 
                ? 'bg-primary/10 text-primary border-primary/20 shadow-none' 
                : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">contrast</span>
            Kontras Tinggi
          </button>
          <button 
            onClick={toggleGrayscale}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-left cursor-pointer transition-all border ${
              grayscale 
                ? 'bg-primary/10 text-primary border-primary/20 shadow-none' 
                : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">palette</span>
            Mode Buta Warna
          </button>
          <button 
            onClick={toggleDyslexia}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-left cursor-pointer transition-all border ${
              dyslexia 
                ? 'bg-primary/10 text-primary border-primary/20 shadow-none' 
                : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">font_download</span>
            Font Readability
          </button>
          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between px-2">
            <span className="text-[11px] font-bold text-slate-550">Ukuran Teks:</span>
            <div className="flex gap-1.5">
              <button 
                onClick={decreaseFontSize}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 border-none rounded-xl flex items-center justify-center font-bold text-xs text-slate-600 transition-colors cursor-pointer"
              >
                A-
              </button>
              <button 
                onClick={increaseFontSize}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 border-none rounded-xl flex items-center justify-center font-bold text-xs text-slate-600 transition-colors cursor-pointer"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => {
          if (!showAccessMenu) {
            handleSpeakStatus();
          }
          setShowAccessMenu(!showAccessMenu);
        }}
        className="w-14 h-14 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border border-black/5"
      >
        <span className="material-symbols-outlined text-[28px]">accessibility_new</span>
      </button>
    </div>
  );
}
