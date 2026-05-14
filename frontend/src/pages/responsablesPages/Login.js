// src/pages/responsablesPages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import '../adminPages/admin.css';

function LoginResponsable() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('responsableToken');
    if (token) navigate('/responsable/dashboard');
    const savedEmail = localStorage.getItem('rememberedResponsableEmail');
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez saisir votre email et mot de passe.');
      setLoading(false); return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();

      if (response.status === 200 && data.success && data.data?.token) {
        if (data.data.user?.role === 'responsable') {
          localStorage.setItem('responsableToken', data.data.token);
          localStorage.setItem('responsableUser', JSON.stringify(data.data.user));
          if (rememberMe) localStorage.setItem('rememberedResponsableEmail', email.trim());
          else localStorage.removeItem('rememberedResponsableEmail');
          
          setSuccess(true);
          setTimeout(() => navigate('/responsable/dashboard'), 1000);
        } else {
          setError('Accès refusé : cette page est réservée aux responsables.');
        }
      } else {
        setError(data.message || 'Email ou mot de passe incorrect.');
      }
    } catch (err) {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rms-login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(2,132,199,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="rms-login-card" style={{ background: 'rgba(15,15,26,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 25px -5px rgba(14,165,233,0.5)' }}>
            <Users size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>Espace Responsable</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Connectez-vous pour gérer votre équipe</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '20px', fontSize: '0.9rem' }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Connexion réussie ! Redirection...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Email professionnel</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Mail size={18} /></div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@entreprise.com"
                required
                disabled={loading}
                autoFocus
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px 12px 44px', color: '#f8fafc', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.background = 'rgba(14,165,233,0.05)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Lock size={18} /></div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 44px', color: '#f8fafc', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.background = 'rgba(14,165,233,0.05)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex' }}
                title={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', width: 'fit-content' }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Se souvenir de moi</span>
          </label>

          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', marginTop: '10px', boxShadow: '0 4px 14px 0 rgba(14,165,233,0.39)' }}>
            {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><div className="rms-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Connexion...</span> : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
            <ShieldCheck size={14} /> Connexion sécurisée
          </div>
          <a href="/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#38bdf8'} onMouseOut={e => e.target.style.color = '#0ea5e9'}>
            <RefreshCw size={14} /> Espace administrateur
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginResponsable;