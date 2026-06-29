'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/context/AuthContext';
import { useAccessibility } from '../../../lib/context/AccessibilityContext';
import { authApi } from '../../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuthToken, user } = useAuth();
  const { speak } = useAccessibility();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  
  // Login input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register input states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleSpeak = () => {
    const text = activeTab === 'login' 
      ? 'Halaman Masuk DisaCare Bandung. Silakan isi email dan kata sandi Anda.'
      : 'Halaman Daftar DisaCare Bandung. Silakan isi nama lengkap, email, kata sandi, dan konfirmasi kata sandi Anda.';
    speak(text);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      if (res.status === 'success' && res.data.token) {
        setAuthToken(res.data.token);
        // Redirect is handled by the useEffect above
      } else {
        setErrorMsg(res.message || 'Login gagal.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Email atau kata sandi salah!';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regPass !== regConfirm) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(regName, regEmail.trim().toLowerCase(), regPass);
      if (res.status === 'success') {
        setRegSuccess(true);
        setTimeout(() => {
          setRegSuccess(false);
          setActiveTab('login');
          setEmail(regEmail);
          setPassword(regPass);
        }, 2000);
      } else {
        setErrorMsg(res.message || 'Registrasi gagal.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || 'Registrasi gagal. Email mungkin sudah terdaftar.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 font-body-md text-slate-800">
      <main className="w-full max-w-[480px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 transition-all duration-300 overflow-hidden">
          
          {/* Header */}
          <div className="p-8 text-center border-b border-slate-100 flex flex-col items-center">
            <div className="flex justify-center mb-4">
              <Link href="/">
                <img alt="DisaCare Logo" className="h-10 w-auto object-contain cursor-pointer" src="/logo.png" />
              </Link>
            </div>
            <p className="text-slate-500 max-w-[300px] mx-auto text-xs font-semibold leading-relaxed">
              Portal Aksesibilitas Fasilitas Publik Kota Bandung
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex w-full border-b border-slate-100">
            <button 
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`flex-1 py-4 font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'border-b-2 border-indigo-650 text-indigo-650' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Masuk
            </button>
            <button 
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              className={`flex-1 py-4 font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'border-b-2 border-indigo-650 text-indigo-650' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Daftar
            </button>
          </div>

          <div className="p-8">
            {/* Error alerts */}
            {errorMsg && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm flex items-center gap-2 mb-6 border border-rose-100 animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Registration success feedback */}
            {regSuccess && (
              <div className="bg-teal-50 text-teal-700 p-4 rounded-xl text-sm flex items-center gap-2 mb-6 border border-teal-100 animate-fade-in">
                <span className="material-symbols-outlined text-[20px] text-teal-600">check_circle</span>
                <span className="font-semibold">Registrasi berhasil! Mengalihkan...</span>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1" htmlFor="login-email">Email</label>
                  <input 
                    className="w-full h-[48px] px-4 bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl transition-all text-slate-800 placeholder-slate-400 font-semibold text-sm" 
                    id="login-email" 
                    placeholder="nama@email.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1" htmlFor="login-password">Kata Sandi</label>
                  <div className="relative">
                    <input 
                      className="w-full h-[48px] px-4 pr-12 bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl transition-all text-slate-800 placeholder-slate-400 font-semibold text-sm" 
                      id="login-password" 
                      placeholder="••••••••" 
                      required 
                      type={showLoginPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer" 
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        {showLoginPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button 
                  className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm border border-indigo-600/20" 
                  type="submit"
                  disabled={loading}
                >
                  {loading && <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>}
                  {loading ? 'Menghubungkan...' : 'Masuk'}
                </button>
                
                <div className="text-center">
                  <a className="text-xs text-indigo-650 font-bold hover:underline" href="#">Lupa kata sandi?</a>
                </div>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-150"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-slate-400">atau login dengan</span>
                  </div>
                </div>
                
                {/* Demo accounts credentials info box */}
                <div className="bg-indigo-50/50 border border-indigo-150 p-4 rounded-xl text-sm space-y-3 text-indigo-750">
                  <p className="font-bold flex items-center gap-2 text-indigo-650">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    Kredensial Akun Demo (Uji Coba)
                  </p>
                  <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                    <div className="p-2.5 bg-white/70 rounded-lg border border-slate-150">
                      <p className="font-extrabold text-indigo-650">Akses Admin Dashboard:</p>
                      <p className="font-mono mt-0.5">Email: admin@disacare.id</p>
                      <p className="font-mono">Sandi: adminpassword123</p>
                    </div>
                    <div className="p-2.5 bg-white/70 rounded-lg border border-slate-150">
                      <p className="font-extrabold text-indigo-650">Akses Form Kontributor:</p>
                      <p className="font-mono mt-0.5">Email: contributor@disacare.id</p>
                      <p className="font-mono">Sandi: contributorpassword123</p>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form className="space-y-6" onSubmit={handleRegisterSubmit}>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1" htmlFor="reg-nama">Nama Lengkap</label>
                  <input 
                    className="w-full h-[48px] px-4 bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl transition-all text-slate-800 placeholder-slate-400 font-semibold text-sm" 
                    id="reg-nama" 
                    placeholder="Masukkan nama lengkap" 
                    required 
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1" htmlFor="reg-email">Email</label>
                  <input 
                    className="w-full h-[48px] px-4 bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl transition-all text-slate-800 placeholder-slate-400 font-semibold text-sm" 
                    id="reg-email" 
                    placeholder="nama@email.com" 
                    required 
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-550 mb-1" htmlFor="reg-pass">Kata Sandi</label>
                    <div className="relative">
                      <input 
                        className="w-full h-[48px] px-4 pr-12 bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl transition-all text-slate-800 placeholder-slate-400 font-semibold text-sm" 
                        id="reg-pass" 
                        placeholder="••••••••" 
                        required 
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                      />
                      <button 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-indigo-650 transition-colors cursor-pointer" 
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        type="button"
                      >
                        <span className="material-symbols-outlined">
                          {showRegisterPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-550 mb-1" htmlFor="reg-confirm">Konfirmasi</label>
                    <div className="relative">
                      <input 
                        className="w-full h-[48px] px-4 bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl transition-all text-slate-800 placeholder-slate-400 font-semibold text-sm" 
                        id="reg-confirm" 
                        placeholder="••••••••" 
                        required 
                        type="password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl flex items-start gap-3 border border-teal-100 text-teal-700 text-xs font-semibold leading-relaxed">
                  <span className="material-symbols-outlined text-teal-605">info</span>
                  <p>
                    Akun akan didaftarkan sebagai Kontributor untuk membantu memverifikasi aksesibilitas di Bandung.
                  </p>
                </div>
                <button 
                  className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-555 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-md border border-indigo-600/20 cursor-pointer flex items-center justify-center gap-2 text-sm" 
                  type="submit"
                  disabled={loading}
                >
                  {loading && <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>}
                  Daftar Sekarang
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Accessibility FAB Button */}
      {mounted && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          <button 
            onClick={handleSpeak}
            className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-indigo-650/20 animate-fade-in" 
            id="accessibility-fab"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              accessibility_new
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
