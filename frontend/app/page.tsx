'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '../lib/context/AuthContext';
import { useAccessibility } from '../lib/context/AccessibilityContext';
import { placesApi } from '../lib/api';

const MiniMap = dynamic(() => import('../components/map/MiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-200 animate-pulse rounded-3xl flex items-center justify-center text-slate-400 font-bold text-sm">
      Memuat Peta...
    </div>
  ),
});

interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  score: number;
  isVerified: boolean;
  image: string;
  facilities: string[];
  severity: 'good' | 'medium' | 'bad';
  latitude: number;
  longitude: number;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user, logout, isContributor, isAdmin } = useAuth();
  const {
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
  } = useAccessibility();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mascot state
  const [mascotTip, setMascotTip] = useState('Halo! Saya Didi. Selamat datang di Peta Aksesibilitas DisaCare. Klik robot Didi di atas untuk melihat info!');
  const [isDidiTalking, setIsDidiTalking] = useState(false);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // FAQ Accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Selected place state for map interaction
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch places from Go API
  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Map category UI filter to API category string
        let categoryParam = '';
        if (activeFilter === 'Mall') categoryParam = 'mall';
        else if (activeFilter === 'Kampus') categoryParam = 'kampus';
        else if (activeFilter === 'Rumah Sakit') categoryParam = 'rumah_sakit';
        else if (activeFilter === 'Kantor Pemerintah') categoryParam = 'kantor_pemerintah';
        else if (activeFilter === 'Taman') categoryParam = 'taman';
        else if (activeFilter === 'Stasiun') categoryParam = 'stasiun';

        const res = await placesApi.getAll({
          search_query: searchQuery,
          category_filter: categoryParam,
        });

        if (res.status === 'success' && res.data) {
          const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const mappedPlaces: Place[] = res.data.map((p: any) => {
            // Build facilities array from checklist
            const facilities: string[] = [];
            if (p.checklist) {
              if (p.checklist.has_ramp) facilities.push('RAMP');
              if (p.checklist.has_disability_toilet) facilities.push('TOILET DIFABEL');
              if (p.checklist.has_guiding_block) facilities.push('GUIDING BLOCK');
              if (p.checklist.has_parking) facilities.push('PARKIR KHUSUS');
              if (p.checklist.has_wide_door) facilities.push('PINTU LEBAR');
              if (p.checklist.has_elevator) facilities.push('LIFT');
            }

            // Photo path resolution
            let image = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=600&auto=format&fit=crop';
            if (p.primary_photo) {
              image = p.primary_photo.startsWith('http') ? p.primary_photo : `${apiURL}${p.primary_photo}`;
            }

            const score = p.accessibility_score || 0;
            let severity: 'good' | 'medium' | 'bad' = 'bad';
            if (score >= 80) severity = 'good';
            else if (score >= 50) severity = 'medium';

            return {
              id: p.id,
              name: p.name,
              category: p.category,
              address: p.address,
              score: Math.round(score),
              isVerified: p.is_verified,
              image,
              facilities,
              severity,
              latitude: p.latitude,
              longitude: p.longitude,
            };
          });

          setPlaces(mappedPlaces);
          if (mappedPlaces.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(mappedPlaces[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load places:', err);
        setError('Gagal memuat data tempat.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce query
    const timeoutId = setTimeout(() => {
      fetchPlaces();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilter]);

  // Carousel slide timer
  useEffect(() => {
    if (places.length === 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(places.length, 3));
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [places]);

  const filters = ['Semua', 'Mall', 'Kampus', 'Rumah Sakit', 'Kantor Pemerintah', 'Taman', 'Stasiun'];

  const handleSpeakWelcome = () => {
    setIsDidiTalking(true);
    speak('Selamat datang di Peta Aksesibilitas DisaCare Bandung. Silakan gunakan panel pencarian di sebelah kiri atau pilih titik lokasi pada peta di sebelah kanan untuk mendengarkan informasi detail.');
    setTimeout(() => setIsDidiTalking(false), 9000);
  };

  const speakMascotTip = () => {
    const tips = [
      'Gunakan tombol di pojok kanan bawah untuk mengaktifkan kontras tinggi, buta warna, atau mode huruf khusus disleksia.',
      'Klik salah satu nama mal, kampus, atau stasiun di daftar kiri untuk menyorot lokasinya pada peta.',
      'Data tempat terverifikasi dengan audit foto fisik oleh tim kami.',
      'Ketik fasilitas seperti "ramp" atau "lift" untuk menyaring tempat yang ramah kursi roda.'
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setMascotTip(randomTip);
    setIsDidiTalking(true);
    speak(randomTip);
    setTimeout(() => setIsDidiTalking(false), 6000);
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const getDashboardUrl = () => {
    if (isAdmin) return '/admin';
    return '/contribute';
  };

  const handleSearchClick = () => {
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (category: string) => {
    setActiveFilter(category);
  };

  const selectedPlace = selectedPlaceId ? (places.find(p => p.id === selectedPlaceId) || null) : null;

  const faqs = [
    {
      q: 'Apa itu Rapor Aksesibilitas DisaCare?',
      a: 'Rapor Aksesibilitas adalah persentase tingkat kemudahan akses suatu tempat bagi rekan-rekan difabel, dihitung berdasarkan ketersediaan ramp, lift, toilet ramah disabilitas, parkir khusus, dan guiding block.'
    },
    {
      q: 'Bagaimana cara mendaftar sebagai Kontributor?',
      a: 'Klik tombol "Daftar" di tab navigasi atas, isi formulir registrasi, dan akun Anda akan otomatis terdaftar sebagai kontributor untuk membagikan data fasilitas ramah difabel di Bandung.'
    },
    {
      q: 'Bagaimana sistem verifikasi data tempat publik dilakukan?',
      a: 'Setiap laporan tempat baru wajib menyertakan foto bukti fisik fasilitas ramah disabilitas. Tim Admin DisaCare akan memverifikasi kesesuaian foto sebelum mempublikasikannya ke dalam direktori publik.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-800 transition-all duration-300">
      {/* Toast Notification */}
      <div id="toast" className="hidden">Notifikasi</div>

      {/* Navigation */}
      <nav id="main-nav" className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-black/5 px-6 h-16 flex items-center justify-between transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
          <img src="/logo.png" alt="DisaCare Logo" className="h-14 w-auto object-contain" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex space-x-8 font-semibold text-slate-500 text-sm">
          <Link href="/" className="hover:text-primary transition-colors py-2">Beranda</Link>
          {mounted && isContributor && (
            <Link href="/contribute" className="hover:text-primary transition-colors py-2">Bantu Lapor</Link>
          )}
          <a href="#faq-section" className="hover:text-primary transition-colors py-2">Bantuan / FAQ</a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {!mounted ? (
            <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-full border border-slate-200/40"></div>
          ) : !user ? (
            <>
              <Link href="/login">
                <button className="text-slate-500 font-semibold hover:text-slate-900 px-4 py-2 cursor-pointer text-xs uppercase tracking-wider transition-colors">
                  Masuk
                </button>
              </Link>
              <Link href="/login">
                <button className="ios-btn-primary px-5 py-2.5 text-xs uppercase tracking-wider cursor-pointer">
                  Gabung Sekarang
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href={getDashboardUrl()}>
                <button className="ios-btn-primary px-5 py-2.5 text-xs uppercase tracking-wider cursor-pointer">
                  Dashboard {isAdmin ? 'Admin' : ''}
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-slate-400 font-semibold hover:text-red-500 px-4 py-2 cursor-pointer text-xs uppercase tracking-wider transition-colors"
              >
                Keluar
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Localized Filter wrapper (doesn't wrap fixed Navbar or AccessibilityMenu, preventing disappearing bug!) */}
      <div 
        style={{ 
          filter: grayscale 
            ? 'grayscale(1)' 
            : highContrast 
              ? 'contrast(1.25) brightness(1.05)' 
              : 'none' 
        }} 
        className="flex-grow flex flex-col"
      >

      {/* Hero Header Section */}
      <header className="relative pt-32 pb-16 bg-gradient-to-b from-slate-200/30 to-transparent border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Title & Carousel */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Bandung Inklusif Spasial
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Jelajahi Kota Bandung <br/>
                  <span className="text-primary">Tanpa Hambatan</span>
                </h1>
                <p className="text-slate-500 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
                  Temukan kelayakan fasilitas penunjang disabilitas fisik di lokasi tujuan Anda secara real-time berdasarkan audit lapangan terverifikasi.
                </p>
              </div>

              {/* Quick Search */}
              <div className="space-y-3">
                <div className="relative w-full max-w-md">
                  <span className="material-symbols-outlined text-slate-400 absolute left-3 top-2.5 text-[20px]">search</span>
                  <input 
                    type="text"
                    placeholder="Cari tempat atau fasilitas (ramp, lift)..."
                    className="w-full ios-search-input font-medium text-slate-800 placeholder-slate-400 transition-all pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                    </button>
                  )}
                </div>
                
                {/* Search suggestion pills */}
                <div className="flex flex-wrap gap-2 items-center text-xs font-semibold text-slate-500 select-none">
                  <span className="text-slate-400">Pencarian Cepat:</span>
                  {['Ramp', 'Toilet', 'Parkir', 'Lift', 'Guiding Block'].map((sug) => (
                    <button
                      key={sug}
                      onClick={() => {
                        setSearchQuery(sug);
                        document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white hover:bg-primary/10 border border-black/5 hover:border-primary/25 hover:text-primary px-3 py-1 rounded-full cursor-pointer transition-all text-[11px] font-semibold shadow-none"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Places Carousel */}
              {places.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">featured_play_list</span>
                    Rekomendasi Tempat Aksesibel
                  </h3>
                  
                  <div className="relative ios-card p-4 overflow-hidden group">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="w-full md:w-44 h-32 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                        <img 
                          src={places[currentSlide % places.length].image} 
                          alt={places[currentSlide % places.length].name} 
                          className="w-full h-full object-cover transition-all duration-500 transform hover:scale-105" 
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-700 border border-black/5 shadow-sm capitalize">
                          {places[currentSlide % places.length].category.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {places[currentSlide % places.length].name}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0 ${
                              places[currentSlide % places.length].score >= 80 
                                ? 'bg-tertiary/10 text-tertiary' 
                                : 'bg-orange-500/10 text-orange-600'
                            }`}>
                              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              {places[currentSlide % places.length].score}%
                            </span>
                          </div>
                          
                          {/* Visual score progress bar inside carousel card */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span>Skor Kelayakan</span>
                              <span className={places[currentSlide % places.length].score >= 80 ? 'text-tertiary' : 'text-orange-500'}>
                                {places[currentSlide % places.length].score >= 80 ? 'Sangat Aksesibel' : 'Cukup Aksesibel'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  places[currentSlide % places.length].score >= 80 ? 'bg-tertiary' : 'bg-orange-500'
                                }`}
                                style={{ width: `${places[currentSlide % places.length].score}%` }}
                              />
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-550 font-medium leading-relaxed line-clamp-2">
                            {places[currentSlide % places.length].address}
                          </p>
                        </div>

                        {/* Navigation & Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <button 
                            onClick={() => {
                              setSelectedPlaceId(places[currentSlide % places.length].id);
                              document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            Lihat di Peta
                            <span className="material-symbols-outlined text-[12px] font-bold">arrow_forward_ios</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                              {places.slice(0, 3).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentSlide(idx)}
                                  className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                                    currentSlide % places.length === idx ? 'bg-primary w-3.5' : 'bg-slate-200 hover:bg-slate-350'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex gap-1 border-l border-slate-150 pl-3">
                              <button 
                                onClick={() => {
                                  if (places.length > 0) {
                                    setCurrentSlide((prev) => (prev - 1 + places.length) % places.length);
                                  }
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-none border-none"
                              >
                                <span className="material-symbols-outlined text-[14px] font-bold text-slate-500">chevron_left</span>
                              </button>
                              <button 
                                onClick={() => {
                                  if (places.length > 0) {
                                    setCurrentSlide((prev) => (prev + 1) % places.length);
                                  }
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-none border-none"
                              >
                                <span className="material-symbols-outlined text-[14px] font-bold text-slate-500">chevron_right</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Large Interactive Mascot Didi */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative w-full">
              <div className="absolute w-72 h-72 rounded-full bg-primary/5 blur-3xl -z-10 animate-pulse"></div>
              
              <div className="w-full max-w-sm ios-card p-6 relative overflow-hidden flex flex-col items-center text-center hover:border-primary/20 transition-all duration-300">
                
                {/* Speech bubble */}
                <div className="relative bg-primary text-white px-4 py-3 rounded-2xl mb-6 shadow-sm max-w-[280px]">
                  <p className="text-[11px] font-semibold leading-relaxed">
                    {mascotTip}
                  </p>
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-primary rotate-45"></div>
                </div>

                {/* Didi SVG */}
                <div 
                  className="relative cursor-pointer group select-none transition-transform hover:scale-105 active:scale-95"
                  onClick={speakMascotTip}
                  title="Klik Didi untuk tips aksesibilitas!"
                >
                  <div className="absolute bottom-0 inset-x-0 mx-auto w-32 h-6 bg-slate-100 rounded-full blur-md -z-10 group-hover:scale-90 transition-all"></div>
                  
                  <svg
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-40 h-40 animate-float"
                  >
                    {/* Shadow underneath */}
                    <ellipse cx="50" cy="85" rx="20" ry="4" fill="#cbd5e1" opacity="0.6" />
                    
                    {/* Floating Base / Wheel */}
                    <ellipse cx="50" cy="72" rx="16" ry="6" fill="#787af6" />
                    <circle cx="44" cy="74" r="3" fill="#007aff" />
                    <circle cx="56" cy="74" r="3" fill="#007aff" />
                    
                    {/* Round Body/Head Unit */}
                    <circle cx="50" cy="42" r="28" fill="#ffffff" stroke="#e5e5ea" strokeWidth="2" />
                    
                    {/* Face Screen */}
                    <rect x="30" y="27" width="40" height="24" rx="10" fill="#1c1c1e" stroke="#e5e5ea" strokeWidth="1" />
                    
                    {/* Expressive Winking/Blinking Eyes */}
                    {isDidiTalking ? (
                      <>
                        <path d="M35 38 Q40 33 45 38" stroke="#30d158" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <path d="M55 38 Q60 33 65 38" stroke="#30d158" strokeWidth="3" strokeLinecap="round" fill="none" />
                      </>
                    ) : (
                      <>
                        <ellipse cx="40" cy="38" rx="3.5" ry="4.5" fill="#30d158" className="animate-blink" />
                        <ellipse cx="60" cy="38" rx="3.5" ry="4.5" fill="#30d158" className="animate-blink" />
                      </>
                    )}
                    
                    {/* Rosy cheeks */}
                    <circle cx="35" cy="44" r="2" fill="#ff453a" opacity="0.8" />
                    <circle cx="65" cy="44" r="2" fill="#ff453a" opacity="0.8" />
                    
                    {/* Happy Smile */}
                    <path d="M47 43 Q50 46 53 43" stroke="#30d158" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    
                    {/* Cute Ears / Side Bolts */}
                    <rect x="18" y="36" width="4" height="12" rx="2" fill="#007aff" />
                    <rect x="78" y="36" width="4" height="12" rx="2" fill="#007aff" />
                    
                    {/* Yellow Glow Antenna */}
                    <line x1="50" y1="14" x2="50" y2="5" stroke="#007aff" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="50" cy="4" r="3.5" fill="#ff9500" className="animate-pulse" />
                    
                    {/* Waving Arms */}
                    <path d="M19 46 Q10 48 14 55" stroke="#007aff" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M81 46 Q90 48 86 55" stroke="#007aff" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </div>

                <div className="mt-4 space-y-1">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center justify-center gap-1">
                    Kenalkan, Asisten Didi!
                    <span className="material-symbols-outlined text-[16px] text-amber-500 animate-wave">waving_hand</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium max-w-[240px]">
                    Klik robot Didi untuk mendengar tips aksesibilitas menarik di Kota Bandung.
                  </p>
                </div>

                <div className="mt-4 flex gap-2 w-full justify-center">
                  <button 
                    onClick={speakMascotTip}
                    className="ios-btn-secondary px-3.5 py-1.5 text-[10px] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">volume_up</span>
                    Dengar Tips
                  </button>
                  <button 
                    onClick={handleSpeakWelcome}
                    className="bg-slate-100 hover:bg-slate-250 text-slate-600 px-3.5 py-1.5 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Info Halaman
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Interactive Metric Stats Section */}
      <section className="bg-white border-y border-black/[0.04] py-8 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-extrabold text-primary">120+</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fasilitas Publik</p>
            </div>
            <div className="space-y-1 border-l border-slate-100">
              <p className="text-2xl md:text-3xl font-extrabold text-tertiary">98%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rapor Akurasi</p>
            </div>
            <div className="space-y-1 border-l border-slate-100">
              <p className="text-2xl md:text-3xl font-extrabold text-amber-500">450+</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laporan Audit</p>
            </div>
            <div className="space-y-1 border-l border-slate-100">
              <p className="text-2xl md:text-3xl font-extrabold text-secondary">24/7</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inklusivitas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Map-First Split Dashboard Explorer */}
      <main id="explore-section" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 min-h-[600px]">
        
        {/* Left Panel: Search & Scrollable Cards */}
        <section className="w-full lg:w-5/12 flex flex-col gap-6">
          {/* Category Filter Pills Track */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {filters.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border-none whitespace-nowrap ${
                  activeFilter === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-black/5 hover:bg-black/10 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Place List Container */}
          <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[620px] pr-2 scrollbar-thin">
            {isLoading ? (
              <div className="py-24 text-center space-y-4">
                <span className="material-symbols-outlined animate-spin text-[40px] text-primary">sync</span>
                <p className="text-xs text-slate-500 font-semibold">Memuat data tempat...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-error">error</span>
                <h3 className="text-sm font-semibold text-slate-500">{error}</h3>
              </div>
            ) : places.length > 0 ? (
            places.map((place) => (
                <div 
                  key={place.id}
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    setIsModalOpen(true);
                  }}
                  className={`ios-card p-4.5 flex gap-4 cursor-pointer relative overflow-hidden transition-all duration-300 ${
                    selectedPlaceId === place.id 
                      ? 'border-primary ring-1 ring-primary bg-primary/[0.02] scale-[1.01]' 
                      : 'bg-white hover:bg-slate-50/50'
                  }`}
                >
                  {/* Rating color stripe on left */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    place.severity === 'good' ? 'bg-tertiary' : place.severity === 'medium' ? 'bg-amber-500' : 'bg-error'
                  }`} />

                  {/* Thumbnail Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-black/5 flex-shrink-0 bg-slate-50 relative">
                    <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    {place.isVerified && (
                      <div className="absolute bottom-1 right-1 bg-tertiary text-white p-0.5 rounded-full flex items-center justify-center shadow-md" title="Terverifikasi">
                        <span className="material-symbols-outlined text-[10px] font-black">verified</span>
                      </div>
                    )}
                  </div>

                  {/* Place Info details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold tracking-wide uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {place.category.replace('_', ' ')}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            place.isVerified 
                              ? 'bg-primary/5 text-primary'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {place.isVerified ? 'Resmi' : 'Komunitas'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          place.score >= 80 ? 'text-tertiary' : place.score >= 50 ? 'text-amber-600' : 'text-error'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {place.score}%
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-800 mt-1 leading-snug truncate">
                        {place.name}
                      </h3>
                      
                      {/* Visual Score Bar (Horizontal) */}
                      <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            place.severity === 'good' ? 'bg-tertiary' : place.severity === 'medium' ? 'bg-amber-500' : 'bg-error'
                          }`}
                          style={{ width: `${place.score}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 flex items-center gap-0.5 font-medium">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {place.address}
                      </p>
                    </div>

                    {/* Facility Chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {place.facilities.slice(0, 3).map((fac) => (
                        <span key={fac} className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[8px] font-bold text-slate-500">
                          {fac}
                        </span>
                      ))}
                      {place.facilities.length > 3 && (
                        <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[8px] font-bold text-slate-400">
                          +{place.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-slate-400">search_off</span>
                <h3 className="text-sm font-semibold text-slate-500">Hasil pencarian kosong</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Silakan coba kata kunci aksesibilitas atau kategori tempat lainnya.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: GIS Interactive Map Visualization */}
        <section className="w-full lg:w-7/12 bg-white rounded-2xl overflow-hidden border border-black/5 relative shadow-sm flex flex-col h-[500px] lg:h-auto min-h-[500px]">
          {places.length > 0 ? (
            <MiniMap 
              places={places} 
              selectedPlaceId={selectedPlaceId} 
              onSelectPlace={(id) => setSelectedPlaceId(id)} 
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center font-bold text-slate-400">
              Peta tidak dapat ditampilkan karena data kosong
            </div>
          )}

          {/* Floating interactive help button */}
          <button
            onClick={speakMascotTip}
            title="Klik untuk tips bantuan dari Didi!"
            className="absolute bottom-4 right-4 bg-white text-slate-800 p-3 rounded-full shadow-sm border border-black/5 hover:scale-105 transition-all z-20 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-amber-500">psychology_alt</span>
          </button>

          {/* Map Scale Legend */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-black/5 text-[10px] space-y-1.5 z-10 shadow-sm">
            <h4 className="font-bold text-slate-800">Keterangan Akses</h4>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
              <span className="text-slate-600">Baik (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600">Cukup (50%-80%)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
              <span className="text-slate-600">Kurang (&lt;50%)</span>
            </div>
          </div>

          {/* Map Overlay Card for currently highlighted Place */}
          {selectedPlace && (
            <div className="absolute bottom-4 left-4 w-80 bg-white/90 backdrop-blur-md rounded-2xl border border-black/5 shadow-lg p-4 space-y-3.5 z-10 animate-fade-in text-slate-800">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPlaceId(null)}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 bg-white/80 hover:bg-slate-100 p-1 rounded-full cursor-pointer transition-colors shadow-none border-none z-20 flex items-center justify-center"
                title="Tutup Info"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">close</span>
              </button>

              {/* Place Image on top of overlay */}
              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 relative border border-black/5">
                <img src={selectedPlace.image} alt={selectedPlace.name} className="w-full h-full object-cover" />
                <span className={`absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedPlace.severity === 'good' 
                    ? 'bg-tertiary text-white' 
                    : selectedPlace.severity === 'medium' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-error text-white'
                }`}>
                  {selectedPlace.score}% Akses
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="bg-primary/5 text-primary text-[8px] font-bold px-2 py-0.5 rounded border border-primary/10 uppercase tracking-wider">
                    {selectedPlace.category.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate pr-6">{selectedPlace.name}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-normal flex items-start gap-0.5 line-clamp-1">
                  <span className="material-symbols-outlined text-[12px] mt-0.5">location_on</span>
                  {selectedPlace.address}
                </p>
              </div>

              {/* Facilities Grid in Map Overlay */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fasilitas Aksesibilitas</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Ramp', key: 'RAMP', icon: 'accessible' },
                    { name: 'Toilet', key: 'TOILET DIFABEL', icon: 'wc' },
                    { name: 'Guiding Block', key: 'GUIDING BLOCK', icon: 'blind' },
                    { name: 'Parkir', key: 'PARKIR KHUSUS', icon: 'local_parking' },
                    { name: 'Pintu Lebar', key: 'PINTU LEBAR', icon: 'sensor_door' },
                    { name: 'Lift', key: 'LIFT', icon: 'elevator' },
                  ].map((fac) => {
                    const isAvailable = selectedPlace.facilities.includes(fac.key);
                    return (
                      <div 
                        key={fac.key} 
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-bold transition-all ${
                          isAvailable 
                            ? 'bg-tertiary/5 border-tertiary/20 text-tertiary' 
                            : 'bg-slate-50 border-black/[0.02] text-slate-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {fac.icon}
                        </span>
                        <span className="truncate max-w-[80px]">{fac.name}</span>
                        <span className="material-symbols-outlined text-[11px] ml-auto">
                          {isAvailable ? 'check' : 'close'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Link href={`/place/${selectedPlace.id}`} className="flex-1">
                  <button className="w-full ios-btn-primary py-2.5 text-[10px] font-bold cursor-pointer text-center">
                    Detail
                  </button>
                </Link>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(selectedPlace.name + " " + selectedPlace.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-grow-[1.5]"
                >
                  <button className="w-full py-2.5 border border-primary/20 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all cursor-pointer text-center font-bold text-[10px]">
                    Google Maps
                  </button>
                </a>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Rapor & Misi Bandung Inklusif Section */}
      <section className="py-16 bg-slate-100 text-slate-800 relative overflow-hidden border-t border-black/5">
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl -top-20 -left-20 -z-10 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 w-full max-w-2xl space-y-3">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Misi & Metodologi</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-slate-900">
              Misi Kota Bandung Inklusif:<br />
              Skor Aksesibilitas Spasial Terverifikasi
            </h2>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
              DisaCare adalah direktori publik yang menilai persentase kelayakan fisik (ramp, toilet difabel, pemandu taktil, lift) berdasarkan regulasi bangunan ramah difabel nasional, didukung dengan audit manual foto bukti lapangan dari kontributor.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-4">
            {mounted && isContributor ? (
              <Link href="/contribute">
                <button className="ios-btn-primary px-6 py-3 text-xs cursor-pointer">
                  Laporkan Fasilitas Baru
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="ios-btn-primary px-6 py-3 text-xs cursor-pointer">
                  Gabung Kontributor
                </button>
              </Link>
            )}
            <a href="#faq-section">
              <button className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-xs transition-all border border-black/10 shadow-none hover:scale-105 active:scale-95 cursor-pointer">
                Cara Kerja Penilaian
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Help / FAQ Section */}
      <section id="faq-section" className="py-20 bg-slate-50 border-t border-black/5 relative overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl -bottom-20 -right-20 -z-10 animate-pulse"></div>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Bantuan</span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Pertanyaan Umum & FAQ
            </h2>
            <p className="text-slate-550 max-w-xl mx-auto text-xs font-medium">
              Temukan jawaban atas pertanyaan mengenai standardisasi data aksesibilitas tempat publik.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className={`ios-card p-4 cursor-pointer transition-all duration-300 ${
                  activeFaq === idx 
                    ? 'border-primary/50 bg-white shadow-md' 
                    : 'bg-white/80 hover:bg-white border-slate-100 shadow-none'
                }`}
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center">
                  <h4 className={`text-sm font-semibold transition-colors ${activeFaq === idx ? 'text-primary' : 'text-slate-800'}`}>
                    {faq.q}
                  </h4>
                  <span className={`material-symbols-outlined transition-colors ${activeFaq === idx ? 'text-primary' : 'text-slate-450'}`}>
                    {activeFaq === idx ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
                {activeFaq === idx && (
                  <p className="text-slate-600 mt-4 text-xs md:text-sm leading-relaxed border-t border-slate-100 pt-4 animate-fade-in font-medium">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white backdrop-blur-md text-slate-800 pt-16 pb-8 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo DisaCare" className="h-9 w-auto object-contain" />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Platform portal informasi dan direktori spasial aksesibilitas fasilitas publik di Kota Bandung bagi difabel.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider mb-4 text-slate-900">Navigasi</h5>
              <ul className="space-y-2 text-slate-500 text-xs font-medium">
                <li><button onClick={handleSearchClick} className="hover:text-primary cursor-pointer text-left transition-colors">Direktori Tempat</button></li>
                {mounted && isContributor && (
                  <li><Link href="/contribute" className="hover:text-primary transition-colors">Kontribusi Baru</Link></li>
                )}
                <li><a href="#faq-section" className="hover:text-primary transition-colors">Tanya Jawab (FAQ)</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider mb-4 text-slate-900">Pemerintahan</h5>
              <ul className="space-y-2 text-slate-500 text-xs font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Pemerintah Kota Bandung</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Dinas Sosial Kota Bandung</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Dinas Komunikasi & Informatika</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider mb-4 text-slate-900">Kontak Pengembang</h5>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email Anda"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 placeholder-slate-400 font-medium"
                />
                <button 
                  onClick={() => alert('Terima kasih! Anda telah terdaftar dalam newsletter kami.')}
                  className="ios-btn-primary px-3 py-2 border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">send</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-150 text-center text-slate-500 text-[10px] font-medium">
            <p>&copy; 2026 DisaCare Bandung Modern Inclusivity. Kota Bandung Juara.</p>
          </div>
        </div>
      </footer>

      </div> {/* Close the localized filter wrapper */}

      {/* iOS-Style Place Details Popup Modal */}
      {isModalOpen && selectedPlace && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-4xl w-full overflow-hidden relative shadow-2xl animate-fade-in flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] text-slate-800 border border-slate-100">
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md hover:scale-105 border-none z-50"
              title="Tutup Rincian"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">close</span>
            </button>

            {/* Left Column: Large Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100 border-r border-slate-100 flex-shrink-0">
              <img src={selectedPlace.image} alt={selectedPlace.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 rounded-2xl text-white">
                <span className="bg-primary text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedPlace.category.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold mt-2 leading-tight">{selectedPlace.name}</h3>
                <p className="text-[10px] text-slate-200 mt-1.5 flex items-start gap-0.5 leading-normal">
                  <span className="material-symbols-outlined text-[12px] mt-0.5">location_on</span>
                  {selectedPlace.address}
                </p>
              </div>
            </div>

            {/* Right Column: Detailed Accessibility Checklist */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between max-h-[calc(90vh-256px)] md:max-h-[85vh]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Kategori Fasilitas
                    </p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedPlace.severity === 'good' 
                        ? 'bg-tertiary/10 text-tertiary' 
                        : selectedPlace.severity === 'medium' 
                          ? 'bg-amber-500/10 text-amber-600' 
                          : 'bg-error/10 text-error'
                    }`}>
                      {selectedPlace.score}% Aksesibilitas
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 mt-2">Status Aksesibilitas Difabel</h4>
                  <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
                    Audit dilakukan oleh komunitas DisaCare untuk memverifikasi sarana aksesibilitas bagi penyandang disabilitas fisik dan sensorik di Bandung.
                  </p>
                </div>

                {/* Facilities Checklist Grid */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Daftar Fasilitas & Kelayakan:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Ramp Kursi Roda', key: 'RAMP', desc: 'Jalur landai landai kursi roda', icon: 'accessible' },
                      { name: 'Toilet Disabilitas', key: 'TOILET DIFABEL', desc: 'WC dengan pegangan handrail', icon: 'wc' },
                      { name: 'Guiding Block', key: 'GUIDING BLOCK', desc: 'Pemandu taktil tunanetra', icon: 'blind' },
                      { name: 'Parkir Khusus', key: 'PARKIR KHUSUS', desc: 'Parkir di depan lobi', icon: 'local_parking' },
                      { name: 'Pintu Lebar', key: 'PINTU LEBAR', desc: 'Pintu bersensor/dorong mudah', icon: 'sensor_door' },
                      { name: 'Lift Luas', key: 'LIFT', desc: 'Lift luas tombol braille', icon: 'elevator' },
                    ].map((fac) => {
                      const isAvailable = selectedPlace.facilities.includes(fac.key);
                      return (
                        <div 
                          key={fac.key} 
                          className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                            isAvailable 
                              ? 'bg-tertiary/5 border-tertiary/20 text-tertiary' 
                              : 'bg-slate-50 border-black/[0.02] text-slate-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px] mt-0.5">
                            {fac.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-[11px] text-slate-800">{fac.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">{fac.desc}</p>
                          </div>
                          <span className="material-symbols-outlined text-[14px] font-black ml-auto mt-0.5">
                            {isAvailable ? 'check_circle' : 'cancel'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                <Link href={`/place/${selectedPlace.id}`} className="flex-1" onClick={() => setIsModalOpen(false)}>
                  <button className="w-full ios-btn-primary py-3.5 text-xs font-bold cursor-pointer text-center">
                    Buka Detail & Foto Bukti
                  </button>
                </Link>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(selectedPlace.name + " " + selectedPlace.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-grow-[1.3]"
                >
                  <button className="w-full py-3.5 border border-primary/20 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all cursor-pointer text-center font-bold text-xs shadow-none">
                    Rute Google Maps
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Accessibility Action Menu (FAB with options popup) */}
      <AccessibilityMenu />
    </div>
  );
}

// Extracted Floating Accessibility Widget
function AccessibilityMenu() {
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
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]">
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
            <span className="text-[11px] font-bold text-slate-500">Ukuran Teks:</span>
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
