'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/context/AuthContext';
import { useAccessibility } from '../../../lib/context/AccessibilityContext';
import { authApi } from '../../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { login: setAuthToken, user } = useAuth();
  const { speak } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
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
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/50 transition-all duration-300">
          
          {/* Header */}
          <div className="p-8 text-center border-b border-surface-container-high flex flex-col items-center">
            <div className="flex justify-center mb-4">
              <Link href="/">
                <img alt="DisaCare Logo" className="h-10 w-auto object-contain cursor-pointer" src="/logo.png" />
              </Link>
            </div>
            <p className="font-label-lg text-on-surface-variant max-w-[300px] mx-auto text-sm">
              Portal Aksesibilitas Fasilitas Publik Kota Bandung
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex w-full border-b border-surface-container-high">
            <button 
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`flex-1 py-4 font-label-lg text-label-lg font-bold transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Masuk
            </button>
            <button 
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              className={`flex-1 py-4 font-label-lg text-label-lg font-bold transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Daftar
            </button>
          </div>

          <div className="p-8">
            {/* Error alerts */}
            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm flex items-center gap-2 mb-6 border border-error/20 animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Registration success feedback */}
            {regSuccess && (
              <div className="bg-tertiary-container/30 text-on-tertiary-container p-4 rounded-xl text-sm flex items-center gap-2 mb-6 border border-tertiary/20 animate-fade-in">
                <span className="material-symbols-outlined text-[20px] text-tertiary">check_circle</span>
                <span className="font-semibold">Registrasi berhasil! Mengalihkan ke halaman Masuk...</span>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="login-email">Email</label>
                  <input 
                    className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-xl transition-all text-on-surface" 
                    id="login-email" 
                    placeholder="nama@email.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="login-password">Kata Sandi</label>
                  <div className="relative">
                    <input 
                      className="w-full h-[48px] px-4 pr-12 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-xl transition-all text-on-surface" 
                      id="login-password" 
                      placeholder="••••••••" 
                      required 
                      type={showLoginPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer" 
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
                  className="w-full h-[52px] bg-primary text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer text-sm" 
                  type="submit"
                  disabled={loading}
                >
                  {loading && <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>}
                  {loading ? 'Menghubungkan...' : 'Masuk'}
                </button>
                
                <div className="text-center">
                  <a className="font-label-sm text-label-sm text-primary font-bold hover:underline" href="#">Lupa kata sandi?</a>
                </div>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-container-high"></div>
                  </div>
                  <div className="relative flex justify-center text-label-sm">
                    <span className="bg-surface-container-lowest px-4 text-on-surface-variant">atau login dengan</span>
                  </div>
                </div>
                
                {/* Demo accounts credentials info box */}
                <div className="bg-[#EBF3FF] border border-primary-fixed p-4 rounded-xl text-sm space-y-3 text-on-primary-fixed-variant">
                  <p className="font-bold flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    Kredensial Akun Demo (Uji Coba)
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="font-bold text-on-primary-fixed">Akses Admin Dashboard:</p>
                      <p className="font-mono mt-0.5">Email: admin@disacare.id</p>
                      <p className="font-mono">Sandi: adminpassword123</p>
                    </div>
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="font-bold text-on-primary-fixed">Akses Form Kontributor:</p>
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
                  <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="reg-nama">Nama Lengkap</label>
                  <input 
                    className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-xl transition-all text-on-surface" 
                    id="reg-nama" 
                    placeholder="Masukkan nama lengkap" 
                    required 
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="reg-email">Email</label>
                  <input 
                    className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-xl transition-all text-on-surface" 
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
                    <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="reg-pass">Kata Sandi</label>
                    <div className="relative">
                      <input 
                        className="w-full h-[48px] px-4 pr-12 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-xl transition-all text-on-surface" 
                        id="reg-pass" 
                        placeholder="••••••••" 
                        required 
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                      />
                      <button 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer" 
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
                    <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="reg-confirm">Konfirmasi</label>
                    <div className="relative">
                      <input 
                        className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-xl transition-all text-on-surface" 
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
                <div className="bg-tertiary-fixed-dim/20 p-4 rounded-xl flex items-start gap-3 border border-tertiary-container/10">
                  <span className="material-symbols-outlined text-tertiary">info</span>
                  <p className="font-label-sm text-label-sm text-on-tertiary-fixed-variant leading-relaxed">
                    Akun akan didaftarkan sebagai Kontributor untuk membantu memverifikasi aksesibilitas di Bandung.
                  </p>
                </div>
                <button 
                  className="w-full h-[52px] bg-primary text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-sm" 
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
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button 
          onClick={handleSpeak}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer" 
          id="accessibility-fab"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            accessibility_new
          </span>
        </button>
      </div>
    </div>
  );
}
