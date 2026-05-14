// src/pages/adminPages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, Mail, Lock } from 'lucide-react';

function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok && data.data?.token) {
        if (data.data.user?.role === 'admin') {
          localStorage.setItem('adminToken', data.data.token);
          localStorage.setItem('adminUser', JSON.stringify(data.data.user));
          setSuccess(true);
          setTimeout(() => navigate('/admin/dashboard'), 1200);
        } else {
          setError('Accès refusé : vous n\'avez pas les droits administrateur.');
        }
      } else {
        setError(data.message || data.error?.message || 'Email ou mot de passe incorrect.');
      }
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <div style={styles.logoIcon}>
              <Shield size={24} />
            </div>
            <span style={styles.logoText}>RMS</span>
          </div>
          <h1 style={styles.title}>Administration</h1>
          <p style={styles.subtitle}>Connectez-vous à votre espace sécurisé</p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={styles.alertError}>
            <span style={styles.alertIcon}><AlertCircle size={18} /></span>
            {error}
          </div>
        )}
        {success && (
          <div style={styles.alertSuccess}>
            <span style={styles.alertIcon}><CheckCircle size={18} /></span>
            Connexion réussie ! Redirection en cours…
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Adresse email</label>
            <div style={styles.inputWrap}>
              <div style={styles.inputIcon}><Mail size={16} /></div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@rms.com"
                required
                disabled={loading}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrap}>
              <div style={styles.inputIcon}><Lock size={16} /></div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{ ...styles.input, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? (
              <span style={styles.btnLoader}>
                <span style={styles.spinner} />
                Connexion…
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        <p style={styles.footer}>Accès réservé aux administrateurs autorisés</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '44px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
    color: 'white',
  },
  logoText: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '10px',
    color: '#f87171',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '20px',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.25)',
    borderRadius: '10px',
    color: '#34d399',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '20px',
  },
  alertIcon: {
    flexShrink: 0,
    display: 'flex',
    width: '18px',
    height: '18px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8' },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '16px',
    height: '16px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    fontFamily: "'Inter', system-ui, sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    padding: '0',
    width: '18px',
    height: '18px',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '13px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLoader: { display: 'flex', alignItems: 'center', gap: '10px' },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#475569',
  },
};

export default LoginAdmin;