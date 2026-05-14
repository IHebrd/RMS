// src/pages/employerPages/LoginEmployer.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck, UserCog, Building2 } from 'lucide-react';
import '../adminPages/admin.css';

function LoginEmployer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (token) navigate('/employer/dashboard');
    const savedEmail = localStorage.getItem('rememberedEmployerEmail');
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
        if (data.data.user?.role === 'employer') {
          localStorage.setItem('employerToken', data.data.token);
          localStorage.setItem('employerUser', JSON.stringify(data.data.user));
          if (rememberMe) localStorage.setItem('rememberedEmployerEmail', email.trim());
          else localStorage.removeItem('rememberedEmployerEmail');
          
          setSuccess(true);
          setTimeout(() => navigate('/employer/dashboard'), 1000);
        } else {
          setError('Accès refusé : cette page est réservée aux employés.');
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
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="rms-login-card" style={{ background: 'rgba(15,15,26,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.5)' }}>
            <HardHat size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>Espace Employé</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Connectez-vous pour voir vos tâches</p>
        </div>

        {error && (
          <div className="rms-alert rms-alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rms-alert rms-alert-success" style={{ marginBottom: '20px' }}>
            <CheckCircle size={18} />
            <span>Connexion réussie ! Redirection...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="rms-form-group">
            <label>Email professionnel</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Mail size={18} /></div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom.prenom@entreprise.tn"
                required
                disabled={loading}
                autoFocus
                className="rms-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="rms-form-group">
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Lock size={18} /></div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="rms-input"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }} />
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Se souvenir de moi</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="rms-btn rms-btn-primary" style={{ padding: '14px', fontSize: '1rem', fontWeight: '600', width: '100%', marginTop: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px 0 rgba(16,185,129,0.3)' }}>
            {loading ? <div className="rms-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div> : null}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
            <ShieldCheck size={14} /> Connexion sécurisée
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Admin</Link>
            <Link to="/responsable/login" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}><UserCog size={14} /> Responsable</Link>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>© 2024 RMS - Espace Employé</p>
        </div>
      </div>
    </div>
  );
}

export default LoginEmployer;