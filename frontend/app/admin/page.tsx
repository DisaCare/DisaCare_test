'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/context/AuthContext';
import { useAccessibility } from '../../lib/context/AccessibilityContext';
import { placesApi } from '../../lib/api';

interface PendingReport {
  id: string;
  num: number;
  name: string;
  category: string;
  contributor: string;
  date: string;
  image: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();
  const {
    highContrast,
    baseSize,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
  } = useAccessibility();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [reports, setReports] = useState<PendingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Fetch pending reports
  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchPending = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await placesApi.getPending();
        if (res.status === 'success' && res.data) {
          const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const mapped: PendingReport[] = res.data.map((r: any, idx: number) => {
            let image = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=200&auto=format&fit=crop';
            if (r.primary_photo) {
              image = r.primary_photo.startsWith('http') ? r.primary_photo : `${apiURL}${r.primary_photo}`;
            }

            const formattedDate = r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : '-';

            return {
              id: r.id,
              num: idx + 1,
              name: r.name,
              category: r.category,
              contributor: r.contributor_name || 'Anonim',
              date: formattedDate,
              image,
            };
          });

          setReports(mapped);
        }
      } catch (err: any) {
        console.error('Failed to fetch pending reports:', err);
        setError('Gagal memuat daftar laporan masuk.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPending();
  }, [user, isAdmin]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.contributor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-slate-205">
        <span className="material-symbols-outlined animate-spin text-[48px] text-indigo-400 mb-4">sync</span>
        <p className="font-bold text-sm text-slate-400">Memverifikasi otoritas admin...</p>
      </div>
    );
  }

  return (
    <div 
      style={{ filter: highContrast ? 'contrast(1.2) brightness(1.1)' : 'none' }} 
      className="min-h-screen flex flex-col bg-background text-slate-800"
    >
      {/* TopNavBar Shell */}
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
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
            <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
            <input 
              className="bg-transparent border-none focus:outline-none text-xs w-40 text-slate-700 placeholder-slate-400 font-semibold" 
              placeholder="Cari laporan..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 border-l border-slate-150 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Administrator</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-indigo-50 border border-slate-200 flex items-center justify-center text-indigo-650 font-bold text-xs">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      </nav>

      {/* SideNavBar Shell */}
      <aside className="fixed left-4 top-24 h-[calc(100vh-120px)] w-60 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-md flex flex-col p-4 z-40 hidden md:flex">
        <div className="flex flex-col gap-1.5 flex-grow">
          <Link href="/admin" className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-150 text-indigo-655 rounded-xl font-bold transition-all text-xs uppercase tracking-wider shadow-sm shadow-indigo-100/50">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin" className="flex items-center gap-3 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-xl text-xs uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span>Verifikasi</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-xl text-xs uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[20px]">location_on</span>
            <span>Peta Publik</span>
          </Link>
        </div>
        
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-1.5">
          <Link href="/" className="flex items-center gap-3 p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs uppercase tracking-wider font-bold transition-all">
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span>Beranda Utama</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 text-slate-600 hover:text-red-650 hover:bg-red-50/40 rounded-xl text-xs uppercase tracking-wider font-bold text-left cursor-pointer w-full transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main style={{ fontSize: `${baseSize}%` }} className="md:ml-68 pt-28 px-4 md:px-8 pb-12 transition-all duration-300 flex-1">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">Dashboard Verifikasi Laporan</h1>
          <p className="text-slate-550 text-xs md:text-sm font-semibold mt-1">
            Tinjau dan validasi foto bukti fisik laporan kontributor untuk menjaga akurasi data fasilitas ramah difabel.
          </p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-extrabold mb-1">Menunggu Verifikasi</p>
              <p className="text-[32px] font-black text-slate-900">{filteredReports.length}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-150 text-indigo-650 p-3 rounded-full">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                pending_actions
              </span>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-teal-50/40 p-6 rounded-2xl border border-teal-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-extrabold mb-1">Audit Selesai</p>
              <p className="text-[32px] font-black text-slate-900">Aktif</p>
            </div>
            <div className="bg-teal-50 border border-teal-150 text-teal-650 p-3 rounded-full">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-rose-50/40 p-6 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-extrabold mb-1">Total Basis Data</p>
              <p className="text-[32px] font-black text-slate-900">Tersinkron</p>
            </div>
            <div className="bg-rose-50 border border-rose-150 text-rose-650 p-3 rounded-full">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                database
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm mb-6 border border-rose-100">
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Main Content Table */}
        {isLoading ? (
          <div className="py-24 text-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-md">
            <span className="material-symbols-outlined animate-spin text-[40px] text-indigo-600">sync</span>
            <p className="text-xs text-slate-550 font-bold">Memuat laporan masuk...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-md rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Daftar Laporan Menunggu</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Nama Tempat</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Kontributor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Tanggal Laporan</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-semibold">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 font-bold">{report.num}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-50 overflow-hidden border border-slate-200 flex-shrink-0">
                            <img alt={report.name} className="w-full h-full object-cover" src={report.image} />
                          </div>
                          <span className="font-extrabold text-slate-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 text-[10px] font-extrabold capitalize">
                          {report.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-600">{report.contributor}</td>
                      <td className="px-6 py-5 text-slate-600">{report.date}</td>
                      <td className="px-6 py-5 text-center">
                        <Link href={`/admin/verify/${report.id}`}>
                          <button className="px-4 py-2 border border-indigo-200 hover:border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 shadow-sm">
                            Tinjau
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-150 flex justify-between items-center px-6 text-xs">
              <span className="text-slate-500 font-bold">
                Menampilkan {filteredReports.length} dari {reports.length} laporan masuk
              </span>
            </div>
          </section>
        ) : (
          <section className="mt-12 bg-white/80 backdrop-blur-xl border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-48 h-48 mb-6 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[80px] text-[#10B981]">check_circle</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Semua Laporan Terverifikasi</h3>
            <p className="text-slate-550 text-xs md:text-sm max-w-md font-semibold leading-relaxed">
              Tidak ada laporan yang menunggu verifikasi saat ini. Pekerjaan yang bagus! Periksa kembali nanti untuk kontribusi baru.
            </p>
          </section>
        )}
      </main>

      {/* Accessibility Menu FAB */}
      {mounted && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {showAccessMenu && (
            <div className="flex flex-col gap-2 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl border border-slate-200 mb-2 w-60 animate-fade-in text-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1.5 border-b border-slate-100">
                Aksesibilitas
              </p>
              <button 
                onClick={toggleHighContrast}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-left cursor-pointer hover:bg-slate-50 text-slate-650 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">contrast</span> Kontras Tinggi
              </button>
              <button 
                onClick={increaseFontSize}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-left cursor-pointer hover:bg-slate-50 text-slate-655 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">text_fields</span> Perbesar Teks A+
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowAccessMenu(!showAccessMenu)}
            className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-indigo-600/20"
          >
            <span className="material-symbols-outlined text-[28px]">accessibility_new</span>
          </button>
        </div>
      )}
    </div>
  );
}
