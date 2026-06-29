'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/context/AuthContext';
import { useAccessibility } from '../../lib/context/AccessibilityContext';
import { placesApi } from '../../lib/api';

export default function ContributePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const {
    highContrast,
    baseSize,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    speak,
  } = useAccessibility();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Form states
  const [placeName, setPlaceName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');

  // Checklists
  const [hasRamp, setHasRamp] = useState(false);
  const [hasToilet, setHasToilet] = useState(false);
  const [hasGuidingBlock, setHasGuidingBlock] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasWideDoor, setHasWideDoor] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);

  // File upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSpeak = () => {
    speak('Halaman Laporkan Tempat Baru DisaCare Bandung. Silakan isi detail informasi dasar tempat, centang fasilitas disabilitas yang tersedia, dan unggah foto bukti fisik.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 5MB');
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      setErrorMsg('Format file harus berupa JPG, JPEG, atau PNG');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!imageFile) {
      setErrorMsg('Foto bukti fisik wajib diunggah');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('place_name', placeName);
      formData.append('category', category);
      formData.append('address', address);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('description', description);

      formData.append('has_ramp', String(hasRamp));
      formData.append('has_disability_toilet', String(hasToilet));
      formData.append('has_guiding_block', String(hasGuidingBlock));
      formData.append('has_parking', String(hasParking));
      formData.append('has_wide_door', String(hasWideDoor));
      formData.append('has_elevator', String(hasElevator));

      formData.append('image_proof', imageFile);

      const res = await placesApi.report(formData);

      if (res.status === 'success') {
        alert('Terima kasih! Laporan Anda telah berhasil disimpan dan sedang menunggu validasi foto oleh administrator.');
        router.push('/');
      } else {
        setErrorMsg(res.message || 'Gagal mengirim laporan');
      }
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      const msg = err.response?.data?.message || 'Gagal mengirim laporan. Cek koneksi backend.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-slate-200">
        <span className="material-symbols-outlined animate-spin text-[48px] text-indigo-400 mb-4">sync</span>
        <p className="font-bold text-sm text-slate-405">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div 
      style={{ filter: highContrast ? 'contrast(1.2) brightness(1.1)' : 'none' }} 
      className="min-h-screen flex flex-col bg-slate-50 text-slate-800"
    >
      {/* TopNavBar */}
      <header className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto rounded-full bg-white/80 backdrop-blur-lg shadow-lg border border-slate-200/80 px-6 h-16 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img alt="DisaCare Logo" className="h-9 w-auto object-contain" src="/logo.png" />
          </Link>
        </div>
        <div className="flex items-center gap-6">
          {!mounted ? (
            <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-full border border-slate-200/40"></div>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-3">
                <span className="font-bold text-slate-650 text-sm">{user.name}</span>
                <div className="w-9 h-9 rounded-full border border-slate-200 bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-500 hover:text-red-650 px-4 py-2 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden md:inline">Keluar</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Canvas */}
      <main style={{ fontSize: `${baseSize}%` }} className="pt-28 pb-32 px-4 md:px-12 max-w-4xl w-full mx-auto flex-1 text-slate-800">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl mb-2 font-black text-slate-900">Laporkan Tempat Baru</h1>
          <p className="text-slate-550 text-sm font-semibold">Bantu sesama dengan memberikan informasi aksesibilitas fasilitas publik di Bandung.</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm flex items-center gap-2 mb-6 border border-rose-100 animate-fade-in">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Section 1: Informasi Dasar */}
          <section className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-md">
            <h2 className="text-lg mb-6 flex items-center gap-2.5 font-bold text-slate-900">
              <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md border border-indigo-500/20">1</span>
              Informasi Dasar Tempat
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2" htmlFor="nama_tempat">Nama Tempat</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none placeholder-slate-400 transition-all font-semibold text-sm" 
                  id="nama_tempat" 
                  placeholder="Contoh: Bandung Indah Plaza" 
                  required 
                  type="text" 
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2" htmlFor="kategori">Kategori</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none transition-all font-semibold text-sm" 
                  id="kategori" 
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" className="bg-slate-50">Pilih Kategori</option>
                  <option value="mall" className="bg-slate-50">Pusat Perbelanjaan (Mall)</option>
                  <option value="kampus" className="bg-slate-50">Kampus / Sekolah</option>
                  <option value="rumah_sakit" className="bg-slate-50">Rumah Sakit / Klinik</option>
                  <option value="taman" className="bg-slate-50">Taman / Ruang Terbuka</option>
                  <option value="kantor_pemerintah" className="bg-slate-50">Kantor Pemerintahan</option>
                  <option value="stasiun" className="bg-slate-50">Stasiun / Halte</option>
                  <option value="lainnya" className="bg-slate-50">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2" htmlFor="alamat">Alamat Lengkap di Bandung</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none placeholder-slate-400 transition-all font-semibold text-sm" 
                  id="alamat" 
                  placeholder="Masukkan alamat lengkap detail..." 
                  rows={3} 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2" htmlFor="lat">Latitude</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none placeholder-slate-400 transition-all font-semibold text-sm" 
                    id="lat" 
                    placeholder="-6.9147" 
                    step="any" 
                    required 
                    type="number" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2" htmlFor="lng">Longitude</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none placeholder-slate-400 transition-all font-semibold text-sm" 
                    id="lng" 
                    placeholder="107.6098" 
                    step="any" 
                    required 
                    type="number" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2" htmlFor="deskripsi">Deskripsi Singkat (opsional)</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none placeholder-slate-400 transition-all font-semibold text-sm" 
                  id="deskripsi" 
                  placeholder="Ceritakan sedikit tentang tempat ini..." 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Checklist Fasilitas */}
          <section className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-md">
            <h2 className="text-lg mb-1 flex items-center gap-2.5 font-bold text-slate-900">
              <span className="bg-indigo-650 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md border border-indigo-500/20">2</span>
              Checklist Fasilitas Disabilitas
            </h2>
            <p className="text-slate-500 mb-6 text-xs pl-10 font-bold uppercase tracking-wider">Centang fasilitas yang tersedia di tempat ini</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                hasRamp 
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-650 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 text-slate-655'
              }`}>
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer" 
                  type="checkbox" 
                  checked={hasRamp}
                  onChange={(e) => setHasRamp(e.target.checked)}
                />
                <span className="material-symbols-outlined mr-2">accessible_forward</span>
                <span className="font-extrabold text-sm">Ramp / Jalur Kursi Roda</span>
              </label>
              <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                hasToilet 
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-650 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 text-slate-655'
              }`}>
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer" 
                  type="checkbox" 
                  checked={hasToilet}
                  onChange={(e) => setHasToilet(e.target.checked)}
                />
                <span className="material-symbols-outlined mr-2">wc</span>
                <span className="font-extrabold text-sm">Toilet Ramah Disabilitas</span>
              </label>
              <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                hasGuidingBlock 
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-650 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 text-slate-655'
              }`}>
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer" 
                  type="checkbox" 
                  checked={hasGuidingBlock}
                  onChange={(e) => setHasGuidingBlock(e.target.checked)}
                />
                <span className="material-symbols-outlined mr-2">blind</span>
                <span className="font-extrabold text-sm">Jalur Guiding Block</span>
              </label>
              <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                hasParking 
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-650 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 text-slate-655'
              }`}>
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer" 
                  type="checkbox" 
                  checked={hasParking}
                  onChange={(e) => setHasParking(e.target.checked)}
                />
                <span className="material-symbols-outlined mr-2">local_parking</span>
                <span className="font-extrabold text-sm">Area Parkir Khusus</span>
              </label>
              <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                hasWideDoor 
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-650 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 text-slate-655'
              }`}>
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer" 
                  type="checkbox" 
                  checked={hasWideDoor}
                  onChange={(e) => setHasWideDoor(e.target.checked)}
                />
                <span className="material-symbols-outlined mr-2">sensor_door</span>
                <span className="font-extrabold text-sm">Pintu Otomatis atau Lebar</span>
              </label>
              <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                hasElevator 
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-650 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 text-slate-655'
              }`}>
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer" 
                  type="checkbox" 
                  checked={hasElevator}
                  onChange={(e) => setHasElevator(e.target.checked)}
                />
                <span className="material-symbols-outlined mr-2">elevator</span>
                <span className="font-extrabold text-sm">Lift / Akses Vertikal</span>
              </label>
            </div>
          </section>

          {/* Section 3: Bukti Foto */}
          <section className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-md">
            <h2 className="text-lg mb-6 flex items-center gap-2.5 font-bold text-slate-900">
              <span className="bg-indigo-650 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md border border-indigo-500/20">3</span>
              Bukti Foto Fisik (Wajib)
            </h2>
            <div 
              onClick={() => document.getElementById('photo-input')?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50/40 transition-all cursor-pointer group"
            >
              <input 
                id="photo-input" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <div className="space-y-4">
                  <img src={imagePreview} alt="Preview Bukti" className="max-h-48 object-contain rounded-lg border border-slate-200" />
                  <p className="text-xs text-slate-500 font-bold">Klik untuk mengganti foto</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-6xl text-slate-400 group-hover:text-indigo-600 mb-4 transition-colors">photo_camera</span>
                  <p className="font-bold mb-1 text-slate-800 text-sm">Klik untuk memilih foto dari komputer</p>
                  <p className="text-slate-550 text-xs font-semibold">Maksimal 1 foto, format JPG/JPEG/PNG (Max 5MB)</p>
                </>
              )}
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-4">
              <span className="text-xl">⚠️</span>
              <p className="text-amber-700 font-semibold text-xs leading-relaxed">Laporan tanpa foto yang valid tidak akan disetujui oleh admin. Pastikan foto menunjukkan fasilitas aksesibilitas dengan jelas.</p>
            </div>
          </section>
 
          {/* Actions */}
          <div className="pt-6 flex flex-col gap-4 items-center">
            <button 
              className="w-full bg-indigo-600 hover:bg-indigo-550 text-white py-4 rounded-xl transition-all active:scale-[0.98] hover:scale-102 shadow-md border border-indigo-600/20 cursor-pointer flex items-center justify-center gap-2 font-bold text-sm" 
              type="submit"
              disabled={submitting}
            >
              {submitting && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
              {submitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
            <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors py-2 font-bold text-xs uppercase tracking-wider">
              Batal
            </Link>
          </div>
        </form>
      </main>

      {/* Sticky Accessibility Toolbar */}
      {mounted && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/90 backdrop-blur-md shadow-lg border-t border-slate-200 rounded-t-2xl text-slate-800">
          <button 
            onClick={handleSpeak}
            className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
            <span className="text-[10px] mt-1 font-bold">Dengarkan</span>
          </button>
          <button 
            onClick={toggleHighContrast}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              highContrast 
                ? 'bg-indigo-50 text-indigo-650 border border-indigo-150' 
                : 'text-slate-655 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">contrast</span>
            <span className="text-[10px] mt-1 font-bold">Kontras Tinggi</span>
          </button>
          <button 
            onClick={increaseFontSize}
            className="flex flex-col items-center justify-center text-slate-655 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">format_size</span>
            <span className="text-[10px] mt-1 font-bold">Teks A+</span>
          </button>
          <button 
            onClick={decreaseFontSize}
            className="flex flex-col items-center justify-center text-slate-655 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">text_decrease</span>
            <span className="text-[10px] mt-1 font-bold">Teks A-</span>
          </button>
        </nav>
      )}

      {/* Spacer for fixed footer */}
      <div className="h-24"></div>
    </div>
  );
}
