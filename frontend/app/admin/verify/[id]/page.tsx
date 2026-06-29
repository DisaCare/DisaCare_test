'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/context/AuthContext';
import { useAccessibility } from '../../../../lib/context/AccessibilityContext';
import { placesApi } from '../../../../lib/api';

interface Facility {
  name: string;
  icon: string;
  checked: boolean;
}

interface ReportDetail {
  id: string;
  name: string;
  category: string;
  contributor: string;
  contributorEmail: string;
  date: string;
  image: string;
  description: string;
  address: string;
  coordinates: string;
  facilities: Facility[];
}

export default function AdminVerifyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();
  const {
    highContrast,
    baseSize,
    toggleHighContrast,
    increaseFontSize,
    speak,
  } = useAccessibility();
  
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isZoomed, setIsZoomed] = useState(false);
  const [isConfirmingApprove, setIsConfirmingApprove] = useState(false);
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        alert('Akses Ditolak: Hanya administrator yang diizinkan mengakses halaman ini.');
        router.push('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  // Fetch report detail
  useEffect(() => {
    if (!user || !isAdmin || !id) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await placesApi.getById(id);
        if (res.status === 'success' && res.data) {
          const p = res.data;
          const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

          // Resolve image
          let image = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=600&auto=format&fit=crop';
          if (p.photos && p.photos.length > 0) {
            image = p.photos[0].file_path.startsWith('http') ? p.photos[0].file_path : `${apiURL}${p.photos[0].file_path}`;
          }

          // Format date
          const formattedDate = p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : '-';

          // Build facilities checklist
          const chk = p.checklist || {};
          const facilities: Facility[] = [
            { name: 'Ramp', icon: 'accessible', checked: chk.has_ramp },
            { name: 'Toilet', icon: 'wc', checked: chk.has_disability_toilet },
            { name: 'Guiding Block', icon: 'blind', checked: chk.has_guiding_block },
            { name: 'Parkir', icon: 'local_parking', checked: chk.has_parking },
            { name: 'Pintu Otomatis', icon: 'sensor_door', checked: chk.has_wide_door },
            { name: 'Lift', icon: 'elevator', checked: chk.has_elevator },
          ];

          setReport({
            id: p.id,
            name: p.name,
            category: p.category,
            contributor: p.contributor_name || 'Anonim',
            contributorEmail: p.contributor_email || '-',
            date: formattedDate,
            image,
            description: p.description || 'Tidak ada deskripsi yang disertakan.',
            address: p.address,
            coordinates: `${p.latitude}, ${p.longitude}`,
            facilities,
          });
        } else {
          setError('Laporan tidak ditemukan.');
        }
      } catch (err: any) {
        console.error('Failed to load pending place detail:', err);
        setError('Gagal memuat detail laporan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id, user, isAdmin]);

  const toggleFacility = (index: number) => {
    if (!report) return;
    const updatedFacilities = [...report.facilities];
    updatedFacilities[index] = {
      ...updatedFacilities[index],
      checked: !updatedFacilities[index].checked
    };
    setReport({
      ...report,
      facilities: updatedFacilities
    });
  };

  const handleApprove = async () => {
    if (!report) return;
    setIsConfirmingApprove(false);
    setActionLoading(true);
    try {
      const res = await placesApi.verify(report.id, 'approve');
      if (res.status === 'updated') {
        showToast('Laporan berhasil disetujui dan tempat telah dipublikasikan!');
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      } else {
        alert(res.message || 'Gagal menyetujui laporan.');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      alert('Kesalahan jaringan saat menyetujui laporan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!report) return;
    setIsConfirmingReject(false);
    setActionLoading(true);
    try {
      const res = await placesApi.verify(report.id, 'reject');
      if (res.status === 'updated') {
        showToast('Laporan ditolak dan dihapus secara permanen.');
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      } else {
        alert(res.message || 'Gagal menolak laporan.');
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      alert('Kesalahan jaringan saat menolak laporan.');
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-slate-800">
        <span className="material-symbols-outlined animate-spin text-[48px] text-indigo-600 mb-4">sync</span>
        <p className="font-bold text-sm text-slate-500">Memuat detail tinjauan...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-slate-800 p-6">
        <span className="material-symbols-outlined text-[80px] text-rose-500 mb-4">error</span>
        <h1 className="text-2xl font-black mb-2">Laporan Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-6">{error || 'ID tidak valid'}</p>
        <Link href="/admin">
          <button className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg border border-indigo-200 cursor-pointer">
            Kembali ke Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div 
      style={{ filter: highContrast ? 'contrast(1.2) brightness(1.1)' : 'none' }} 
      className="min-h-screen flex flex-col bg-background text-slate-800"
    >
      <nav className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto rounded-full bg-white/80 backdrop-blur-lg shadow-lg border border-slate-200/80 px-6 h-16 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img alt="DisaCare Logo" className="h-9 w-auto object-contain" src="/logo.png" />
          </Link>
          <span className="bg-indigo-50 border border-indigo-100 text-indigo-650 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Admin Mode
          </span>
        </div>
        <div className="flex items-center gap-6">
          {!mounted ? (
            <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-full border border-slate-200"></div>
          ) : (
            <div className="flex items-center gap-3 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-850">{user.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Administrator</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-indigo-50 border border-slate-200 flex items-center justify-center text-indigo-650 font-bold text-xs">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* SideNavBar Shell */}
      <aside className="fixed left-4 top-24 h-[calc(100vh-120px)] w-60 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-md flex flex-col p-4 z-40 hidden md:flex">
        <div className="flex flex-col gap-1.5 flex-grow">
          <Link href="/admin" className="flex items-center gap-3 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-55 transition-all rounded-xl text-xs uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin" className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-150 text-indigo-655 rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-sm shadow-indigo-100/50">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
            <span>Verifikasi</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-55 transition-all rounded-xl text-xs uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">location_on</span>
            <span>Peta Publik</span>
          </Link>
        </div>
        
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-1.5">
          <Link href="/" className="flex items-center gap-3 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-55 rounded-xl text-xs uppercase tracking-wider font-bold transition-all">
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span>Beranda Utama</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 text-slate-600 hover:text-rose-655 hover:bg-rose-50/40 rounded-xl text-xs uppercase tracking-wider font-bold text-left cursor-pointer w-full transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main style={{ fontSize: `${baseSize}%` }} className="md:ml-68 pt-28 px-4 md:px-8 pb-20 transition-all duration-300 flex-1 text-slate-800">
        {/* Header & Breadcrumbs */}
        <header className="mb-8">
          <nav className="flex items-center text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Link href="/admin" className="hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700 font-bold">Review: "{report.name}"</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            Peninjauan Laporan: "{report.name}"
          </h1>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column: Media Evidence */}
          <section className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900">
                  <span className="material-symbols-outlined text-indigo-600">image</span>
                  Foto Bukti Fisik
                </h2>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  Oleh: {report.contributor} • {report.date}
                </span>
              </div>
              <div 
                onClick={() => setIsZoomed(true)} 
                className="relative aspect-video rounded-xl overflow-hidden group cursor-zoom-in border border-slate-200"
              >
                <img 
                  alt="Foto Bukti Fisik Fasilitas" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  src={report.image} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/30 flex items-center gap-2 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                    Perbesar Gambar
                  </button>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-650 italic font-semibold leading-relaxed">
                  "{report.description}"
                </p>
              </div>
            </div>

            {/* Mobile/Tablet Decision Section */}
            <div className="lg:hidden bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 text-center">Keputusan Verifikasi</h2>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setIsConfirmingApprove(true)}
                  className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/10 hover:scale-102 active:scale-98 transition-all cursor-pointer border border-emerald-500/20"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Setujui Laporan
                </button>
                <button 
                  onClick={() => setIsConfirmingReject(true)}
                  className="w-full py-3.5 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  Tolak Laporan
                </button>
              </div>
              <div className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-700">
                <span className="material-symbols-outlined text-rose-550">warning</span>
                <p className="text-xs font-semibold leading-relaxed">Laporan yang ditolak akan dihapus secara permanen dari sistem.</p>
              </div>
            </div>
          </section>

          {/* Right Column: Details & Checklist */}
          <section className="col-span-12 lg:col-span-5 space-y-6">
            {/* Info Card */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-md">
              <h2 className="text-base font-extrabold mb-6 flex items-center gap-2 text-slate-900">
                <span className="material-symbols-outlined text-indigo-650">info</span>
                Informasi Tempat
              </h2>
              <div className="space-y-4 text-slate-800">
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Tempat</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5">{report.name}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori</span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5">{report.category.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alamat</span>
                  <span className="font-semibold text-slate-600 text-xs leading-relaxed mt-0.5">{report.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Koordinat</span>
                    <span className="font-semibold text-slate-700 text-xs mt-0.5">{report.coordinates}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Lapor</span>
                    <span className="font-semibold text-slate-700 text-xs mt-0.5">{report.date}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 text-slate-700">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">Kontributor</span>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-55 border border-indigo-150 rounded-full flex items-center justify-center text-indigo-650 font-bold text-xs">
                      {report.contributor.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">{report.contributor}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">{report.contributorEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Card */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-md">
              <div className="mb-4">
                <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900">
                  <span className="material-symbols-outlined text-indigo-650">checklist_rtl</span>
                  Klaim Fasilitas
                </h2>
                <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider mt-1.5">
                  Daftar fasilitas penunjang disabilitas yang diklaim tersedia.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {report.facilities.map((fac, idx) => (
                  <div 
                    key={fac.name} 
                    className={`flex items-center justify-between gap-2 p-3.5 rounded-xl border text-left transition-all ${
                      fac.checked 
                        ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 opacity-60 text-slate-400'
                    }`}
                  >
                    <span className="font-extrabold text-xs">{fac.name}</span>
                    <span className={`material-symbols-outlined text-[18px] ${fac.checked ? 'text-teal-600' : 'text-slate-400'}`}>
                      {fac.checked ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Decision Section */}
            <div className="hidden lg:block bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
              <h2 className="text-base font-extrabold text-center text-slate-900">Keputusan Verifikasi</h2>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setIsConfirmingApprove(true)}
                  className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/10 hover:scale-102 active:scale-98 transition-all cursor-pointer border border-emerald-500/20 group"
                >
                  <span className="material-symbols-outlined group-hover:scale-115 transition-transform">check_circle</span>
                  Setujui Laporan
                </button>
                <button 
                  onClick={() => setIsConfirmingReject(true)}
                  className="w-full py-3.5 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all cursor-pointer group"
                >
                  <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">cancel</span>
                  Tolak Laporan
                </button>
              </div>
              <div className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-700">
                <span className="material-symbols-outlined text-rose-550 mt-0.5">warning</span>
                <p className="text-xs font-semibold leading-relaxed">Laporan yang ditolak akan dihapus secara permanen dari sistem.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-xs">
          <p>© 2026 AksesBandung DisaCare System • Pemerintah Kota Bandung</p>
        </footer>
      </main>

      {/* Accessibility Toolbar FAB */}
      {mounted && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 animate-fade-in">
          {showAccessMenu && (
            <div className="flex flex-col gap-2 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-lg border border-slate-200 mb-2 w-60 animate-fade-in text-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1.5 border-b border-slate-100">
                Aksesibilitas
              </p>
              <button 
                onClick={toggleHighContrast}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-left cursor-pointer hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">contrast</span> Kontras Tinggi
              </button>
              <button 
                onClick={increaseFontSize}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-left cursor-pointer hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">text_fields</span> Perbesar Teks A+
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowAccessMenu(!showAccessMenu)}
            className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-indigo-500/20"
          >
            <span className="material-symbols-outlined text-[28px]">accessibility_new</span>
          </button>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {isZoomed && (
        <div 
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl w-full h-full max-h-[85vh]">
            <img 
              alt="Evidence Zoomed" 
              className="w-full h-full object-contain rounded-lg" 
              src={report.image} 
            />
            <button 
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors border border-white/10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-sm">
              Klik di mana saja untuk menutup
            </p>
          </div>
        </div>
      )}

      {/* Custom Modal Confirmation - Approve */}
      {isConfirmingApprove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl max-w-md w-full rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#10B981]">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
              <h3 className="text-lg font-black text-slate-900">Setujui Kontribusi?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Apakah Anda yakin ingin menyetujui kontribusi dari <strong>{report.contributor}</strong>? Tempat <strong>{report.name}</strong> akan dipublikasikan secara langsung pada direktori publik DisaCare.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setIsConfirmingApprove(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                Batal
              </button>
              <button 
                onClick={handleApprove}
                className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-xs border border-emerald-500/20 uppercase tracking-wider shadow-md"
              >
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal Confirmation - Reject */}
      {isConfirmingReject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl max-w-md w-full rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <span className="material-symbols-outlined text-[36px]">warning</span>
              <h3 className="text-lg font-black text-slate-900">Tolak Kontribusi?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Tindakan ini akan menolak laporan kontributor <strong>{report.contributor}</strong> dan menghapusnya secara permanen dari sistem verifikasi. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setIsConfirmingReject(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                Batal
              </button>
              <button 
                onClick={handleReject}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-xs border border-rose-500/20 uppercase tracking-wider shadow-md"
              >
                Ya, Tolak Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-black text-xs uppercase tracking-wider drop-shadow-md">Memproses Tindakan Admin...</p>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-200 text-slate-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-up">
          <span className="material-symbols-outlined text-indigo-650">info</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
