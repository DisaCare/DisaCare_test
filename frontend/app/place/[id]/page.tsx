'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../lib/context/AuthContext';
import { useAccessibility } from '../../../lib/context/AccessibilityContext';
import { placesApi } from '../../../lib/api';

const MiniMap = dynamic(() => import('../../../components/map/MiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-400 font-bold text-sm">
      Memuat Peta...
    </div>
  ),
});

interface Facility {
  name: string;
  desc: string;
  icon: string;
  checked: boolean;
}

interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string;
  score: number;
  severity: 'good' | 'medium' | 'bad';
  image: string;
  googleMapsUrl: string;
  latitude: number;
  longitude: number;
  facilities: Facility[];
  isVerified: boolean;
  dataSource: string;
}

export default function PlaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user, logout, isContributor } = useAuth();
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

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPlaceDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await placesApi.getById(id);
        if (res.status === 'success' && res.data) {
          const p = res.data;
          const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          
          // Resolve image path
          let image = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=600&auto=format&fit=crop';
          if (p.photos && p.photos.length > 0) {
            image = p.photos[0].file_path.startsWith('http') ? p.photos[0].file_path : `${apiURL}${p.photos[0].file_path}`;
          }

          // Build facilities checklist
          const chk = p.checklist || {};
          const facilities: Facility[] = [
            { name: 'Ramp / Jalur Kursi Roda', desc: 'Jalur landai memudahkan pengguna kursi roda', icon: 'accessible', checked: chk.has_ramp },
            { name: 'Toilet Ramah Disabilitas', desc: 'Toilet khusus dengan pegangan tangan handrail', icon: 'wc', checked: chk.has_disability_toilet },
            { name: 'Jalur Guiding Block', desc: 'Pemandu taktil pengarah jalan tunanetra', icon: 'blind', checked: chk.has_guiding_block },
            { name: 'Area Parkir Khusus', desc: 'Area parkir mobil/motor disabilitas di depan lobi', icon: 'local_parking', checked: chk.has_parking },
            { name: 'Pintu Otomatis / Lebar', desc: 'Pintu masuk lebar bersensor atau mudah didorong', icon: 'sensor_door', checked: chk.has_wide_door },
            { name: 'Lift / Akses Vertikal', desc: 'Lift luas berkapasitas besar dengan tombol braille', icon: 'elevator', checked: chk.has_elevator },
          ];

          const score = p.accessibility_score || 0;
          let severity: 'good' | 'medium' | 'bad' = 'bad';
          if (score >= 80) severity = 'good';
          else if (score >= 50) severity = 'medium';

          setPlace({
            id: p.id,
            name: p.name,
            category: p.category,
            address: p.address,
            description: p.description || 'Tidak ada deskripsi yang tersedia untuk tempat ini.',
            score: Math.round(score),
            severity,
            image,
            googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(p.name + " " + p.address)}`,
            latitude: p.latitude,
            longitude: p.longitude,
            facilities,
            isVerified: p.is_verified,
            dataSource: p.data_source,
          });
        } else {
          setError('Tempat tidak ditemukan.');
        }
      } catch (err: any) {
        console.error('Failed to load place detail:', err);
        setError('Gagal memuat detail tempat.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaceDetail();
  }, [id]);

  const handleSpeak = () => {
    if (!place) return;
    const textToSpeak = `
      Nama tempat: ${place.name}. 
      Kategori: ${place.category.replace('_', ' ')}. 
      Alamat: ${place.address}. 
      Skor kelayakan aksesibilitas: ${place.score} persen.
      Deskripsi tempat: ${place.description}.
      Fasilitas yang tersedia antara lain: ${place.facilities.filter(f => f.checked).map(f => f.name).join(', ')}.
    `;
    speak(textToSpeak);
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary mb-4">sync</span>
        <p className="font-bold text-sm text-slate-400">Memuat detail tempat...</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-6">
        <span className="material-symbols-outlined text-[80px] text-error mb-4">error</span>
        <h1 className="font-display text-headline-lg font-bold mb-2">Tempat Tidak Ditemukan</h1>
        <p className="font-body-md text-on-surface-variant mb-6">{error || 'ID tidak valid'}</p>
        <Link href="/">
          <button className="bg-primary text-white font-bold py-3 px-6 rounded-full shadow-md hover:scale-95 transition-transform cursor-pointer">
            Kembali ke Beranda
          </button>
        </Link>
      </div>
    );
  }

  const scoreLabel = place.score >= 80 ? 'Sangat Aksesibel' : place.score >= 50 ? 'Cukup Aksesibel' : 'Perlu Perbaikan';
  const scoreColorClass = place.score >= 80 ? 'bg-tertiary text-on-tertiary' : place.score >= 50 ? 'bg-amber-600 text-white' : 'bg-error text-on-error';
  const scoreRingColorClass = place.score >= 80 ? 'text-tertiary' : place.score >= 50 ? 'text-amber-500' : 'text-error';

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-800">
      {/* TopNavBar */}
      <nav className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-black/5 px-6 h-16 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img alt="DisaCare Logo" className="h-14 w-auto object-contain" src="/logo.png" />
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-slate-500 font-semibold hover:text-primary transition-colors text-sm">
            Beranda
          </Link>
          {!mounted ? (
            <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-full border border-slate-200/45"></div>
          ) : (
            <>
              {isContributor && (
                <Link href="/contribute" className="hidden md:block text-slate-500 font-semibold hover:text-primary transition-colors text-sm">
                  Kontribusi
                </Link>
              )}
              {!user ? (
                <Link href="/login">
                  <button className="ios-btn-primary px-5 py-2.5 text-sm cursor-pointer">
                    Masuk
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 font-semibold hover:text-red-500 text-sm cursor-pointer transition-colors"
                >
                  Keluar
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Localized Filter wrapper (doesn't wrap fixed Navbars, preventing disappearing bug!) */}
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
        {/* Main Content Layout */}
        <main style={{ fontSize: `${baseSize}%` }} className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-28 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <button className="p-2 hover:bg-slate-100 border border-black/5 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-none">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
          </Link>
          <span className="text-slate-500 text-sm font-semibold">Kembali ke Pencarian</span>
        </div>

        {/* Two Column Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column (60%) */}
          <div className="lg:w-3/5 space-y-6">
            <div className="relative group overflow-hidden rounded-2xl border border-black/5 h-[400px] shadow-none bg-slate-50">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={place.name} src={place.image} />
              <div className="absolute top-4 left-4">
                <span className="bg-primary/95 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-black/5 capitalize">
                  {place.category.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{place.name}</h1>
              <div className="flex items-start gap-2 text-slate-500">
                <span className="material-symbols-outlined mt-1 text-slate-400">location_on</span>
                <p className="font-medium text-slate-600 text-sm">{place.address}</p>
              </div>
              <div className="ios-card p-6 border-l-4 border-l-primary shadow-none">
                <h2 className="text-lg font-bold mb-2 text-slate-900">Tentang Aksesibilitas</h2>
                <p className="text-slate-600 leading-relaxed text-sm font-medium">
                  {place.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (40%) */}
          <div className="lg:w-2/5 space-y-6">
            {/* Map Card */}
            <div className="ios-card p-4 shadow-none flex flex-col items-center">
              <div className="w-full h-[220px] bg-slate-50 rounded-xl overflow-hidden relative border border-black/5">
                <MiniMap 
                  singleLatitude={place.latitude} 
                  singleLongitude={place.longitude} 
                  singlePlaceName={place.name} 
                  zoom={15} 
                />
              </div>
              <a href={place.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="w-full mt-4">
                <button className="w-full py-3 border border-primary/25 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all cursor-pointer text-center font-semibold text-sm shadow-none">
                  Buka di Google Maps
                </button>
              </a>
            </div>

            {/* Accessibility Score Card */}
            <div className="ios-card p-6 shadow-none space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Rapor Aksesibilitas
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${scoreColorClass}`}>
                      {scoreLabel}
                    </span>
                    <span className="bg-primary/5 border border-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      {place.dataSource === 'official' ? 'Data Resmi' : 'Komunitas'}
                    </span>
                  </div>
                </div>
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle className="text-slate-150" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="8"></circle>
                    <circle className={scoreRingColorClass} cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeDasharray="226.2" strokeDashoffset={226.2 - (226.2 * place.score) / 100} strokeLinecap="round" strokeWidth="8"></circle>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-black text-xl text-slate-800">
                    {place.score}%
                  </span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Kualitas Jalur (Ramp)</span>
                  <span className={`font-bold ${place.facilities[0].checked ? 'text-tertiary' : 'text-error'}`}>
                    {place.facilities[0].checked ? 'Tersedia' : 'Tidak Ada'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Kemudahan Toilet</span>
                  <span className={`font-bold ${place.facilities[1].checked ? 'text-tertiary' : 'text-error'}`}>
                    {place.facilities[1].checked ? 'Tersedia' : 'Tidak Ada'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Lift / Akses Vertikal</span>
                  <span className={`font-bold ${place.facilities[5].checked ? 'text-tertiary' : 'text-error'}`}>
                    {place.facilities[5].checked ? 'Tersedia' : 'Tidak Ada'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities Section */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-900">
            <span className="material-symbols-outlined text-primary text-[32px]">info</span>
            Fasilitas Tersedia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {place.facilities.map((fac) => (
              <div key={fac.name} className="flex items-center justify-between p-4 ios-card hover:border-primary/30 shadow-none hover:shadow-none transition-all duration-300 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 border border-black/5 rounded-xl p-3 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-white animate-none">
                      {fac.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 font-bold">{fac.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{fac.desc}</p>
                  </div>
                </div>
                {fac.checked ? (
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-error/30">
                    cancel
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Large Listen Info CTA */}
        <div className="mt-8">
          <button 
            onClick={handleSpeak}
            className="w-full ios-btn-primary py-4.5 flex items-center justify-center gap-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">volume_up</span>
            <span className="text-base font-bold">Dengarkan Informasi Tempat Ini</span>
          </button>
        </div>
      </main>

      </div> {/* Close the localized filter wrapper */}

      {/* Sticky Accessibility Toolbar (BottomNavBar) - Sibling of filter wrapper, safe from bugs! */}
      {mounted && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/90 backdrop-blur-md shadow-sm border-t border-black/5 rounded-t-2xl text-slate-800">
          <button 
            onClick={handleSpeak}
            className="flex flex-col items-center justify-center text-slate-550 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer animate-fade-in"
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
            <span className="text-[10px] mt-1 font-semibold">Dengarkan</span>
          </button>
          <button 
            onClick={toggleHighContrast}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 cursor-pointer animate-fade-in ${
              highContrast 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-slate-550 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">contrast</span>
            <span className="text-[10px] mt-1 font-semibold">Kontras Tinggi</span>
          </button>
          <button 
            onClick={increaseFontSize}
            className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer animate-fade-in"
          >
            <span className="material-symbols-outlined text-[24px]">format_size</span>
            <span className="text-[10px] mt-1 font-semibold">Teks A+</span>
          </button>
          <button 
            onClick={decreaseFontSize}
            className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer animate-fade-in"
          >
            <span className="material-symbols-outlined text-[24px]">text_decrease</span>
            <span className="text-[10px] mt-1 font-semibold">Teks A-</span>
          </button>
        </nav>
      )}

      {/* Spacer for fixed footer */}
      <div className="h-24"></div>
    </div>
  );
}
