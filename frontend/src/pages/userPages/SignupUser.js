// src/pages/userPages/SignupUser.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Phone, Fingerprint, MapPin, Building, UserPlus, ArrowLeft } from 'lucide-react';
import '../adminPages/admin.css';

function SignupUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    cin: '',
    address: '',
    governorate: ''
  });

  const governorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Médenine',
    'Tataouine', 'Djerba'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false); return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false); return;
    }

    const requestData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirm_password: formData.confirm_password,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim() || null,
      cin: formData.cin.trim(),
      address: formData.address.trim() || null,
      governorate: formData.governorate || null
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        setSuccess('Compte créé avec succès ! Redirection...');
        setTimeout(() => navigate('/user/login'), 2000);
      } else {
        setError(data.message || 'Erreur lors de la création du compte');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rms-login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', padding: '40px 20px', position: 'relative', overflowY: 'auto' }}>
      
      {/* Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="rms-login-card" style={{ background: 'rgba(15,15,26,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1, margin: 'auto' }}>
        
        <Link to="/user/login" style={{ position: 'absolute', left: '24px', top: '24px', color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <ArrowLeft size={18} /> Retour
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 10px 25px -5px rgba(99,102,241,0.3)' }}>
            <UserPlus size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>Inscription Client</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Créez votre compte pour accéder à nos services</p>
        </div>

        {error && (
          <div className="rms-alert rms-alert-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rms-alert rms-alert-success" style={{ marginBottom: '24px' }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="rms-form-group">
              <label>Prénom *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><User size={16} /></div>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Prénom" required className="rms-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="rms-form-group">
              <label>Nom *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><User size={16} /></div>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Nom" required className="rms-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="rms-form-group">
              <label>Email *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Mail size={16} /></div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemple.com" required className="rms-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="rms-form-group">
              <label>Téléphone</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Phone size={16} /></div>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Numéro" className="rms-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="rms-form-group">
              <label>CIN *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Fingerprint size={16} /></div>
                <input type="text" name="cin" value={formData.cin} onChange={handleChange} placeholder="Numéro CIN" required className="rms-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="rms-form-group">
              <label>Gouvernorat</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Building size={16} /></div>
                <select name="governorate" value={formData.governorate} onChange={handleChange} className="rms-input" style={{ paddingLeft: '40px' }}>
                  <option value="">Sélectionnez</option>
                  {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                </select>
              </div>
            </div>
            <div className="rms-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Adresse complète</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><MapPin size={16} /></div>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Rue, ville, code postal" className="rms-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="rms-form-group">
              <label>Mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Lock size={16} /></div>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="rms-input" style={{ paddingLeft: '40px', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="rms-form-group">
              <label>Confirmer *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}><Lock size={16} /></div>
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirm_password" value={formData.confirm_password} onChange={handleChange} required className="rms-input" style={{ paddingLeft: '40px', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="rms-btn rms-btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px 0 rgba(99,102,241,0.3)', marginBottom: '24px' }}>
            {loading ? <div className="rms-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div> : null}
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Déjà un compte ? <Link to="/user/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupUser;