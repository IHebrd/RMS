// src/pages/userPages/LoginUser.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck, UserCog, HardHat, UserPlus } from 'lucide-react';
import '../adminPages/admin.css';

function LoginUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) navigate('/user/dashboard');
    const savedEmail = localStorage.getItem('rememberedUserEmail');
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
        if (data.data.user?.role === 'user') {
          localStorage.setItem('userToken', data.data.token);
          localStorage.setItem('userUser', JSON.stringify(data.data.user));
          if (rememberMe) localStorage.setItem('rememberedUserEmail', email.trim());
          else localStorage.removeItem('rememberedUserEmail');
          
          setSuccess(true);
          setTimeout(() => navigate('/user/dashboard'), 1000);
        } else {
          setError('Accès refusé : cette page est réservée aux clients.');
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
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="rms-login-card" style={{ background: 'rgba(15,15,26,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 25px -5px rgba(99,102,241,0.5)' }}>
            <Home size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>Espace Client</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Gérez vos réclamations et services</p>
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
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Mail size={18} /></div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
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
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }} />
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Se souvenir de moi</span>
            </label>
            <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => alert('Contactez le support')}>
              Oublié ?
            </button>
          </div>

          <button type="submit" disabled={loading} className="rms-btn rms-btn-primary" style={{ padding: '14px', fontSize: '1rem', fontWeight: '600', width: '100%', marginTop: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px 0 rgba(99,102,241,0.3)' }}>
            {loading ? <div className="rms-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div> : null}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
            <ShieldCheck size={14} /> Connexion sécurisée
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>
              Pas encore de compte ? <Link to="/user/signup" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UserPlus size={14} /> Créer un compte</Link>
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', fontSize: '0.8rem' }}>
              <Link to="/login" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Admin</Link>
              <Link to="/responsable/login" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><UserCog size={12} /> Responsable</Link>
              <Link to="/employer/login" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><HardHat size={12} /> Employé</Link>
            </div>
          </div>
          <p style={{ color: '#334155', fontSize: '0.7rem' }}>© 2024 RMS - Espace Client</p>
        </div>
      </div>
    </div>
  );
}

export default LoginUser;