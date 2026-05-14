// src/pages/adminPages/AddAdmin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Shield, Save, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import './admin.css';

function AddAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', phone: '', cin: '', is_active: true,
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) return setError('Le prénom est requis');
    if (!form.last_name.trim()) return setError('Le nom est requis');
    if (!form.cin.trim()) return setError('Le CIN est requis');
    if (!form.email.trim()) return setError("L'email est requis");
    if (form.password.length < 6) return setError('Mot de passe minimum 6 caractères');
    if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas');

    setLoading(true); setError(''); setSuccess(false);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim() || null,
          cin: form.cin.trim(),
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/admin/admins'), 1500); }
      else setError(data.message || data.error?.message || `Erreur ${res.status}`);
    } catch { setError('Impossible de contacter le serveur.'); }
    finally { setLoading(false); }
  };

  const PwdInput = ({ value, show, onToggle, onChange, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <input
        className="rms-input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        style={{ paddingRight: '42px' }}
      />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0, width: '18px', height: '18px' }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  return (
    <AdminLayout title="Nouvel administrateur">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate('/admin/admins')}><ArrowLeft size={16} /> Retour aux administrateurs</button>

        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Shield size={22} /></div>
            <div><h1>Nouvel administrateur</h1><p>Créer un compte administrateur</p></div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}</div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />Administrateur créé avec succès ! Redirection…</div>}

        <div className="rms-form-card">
          <form onSubmit={handleSubmit}>
            {/* Identité */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations personnelles</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Prénom <span className="req">*</span></label>
                  <input className="rms-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Ex : Mohamed" required />
                </div>
                <div className="rms-form-group">
                  <label>Nom <span className="req">*</span></label>
                  <input className="rms-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Ex : Ben Ahmed" required />
                </div>
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>CIN <span className="req">*</span></label>
                  <input className="rms-input" value={form.cin} onChange={e => set('cin', e.target.value)} placeholder="Ex : 12345678" required />
                </div>
                <div className="rms-form-group">
                  <label>Téléphone</label>
                  <input className="rms-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Ex : 98765432" />
                </div>
              </div>
            </div>

            {/* Connexion */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations de connexion</div>
              <div className="rms-form-group">
                <label>Email <span className="req">*</span></label>
                <input className="rms-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@rms.com" required />
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Mot de passe <span className="req">*</span></label>
                  <PwdInput value={form.password} show={showPwd} onToggle={() => setShowPwd(!showPwd)} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 caractères" />
                </div>
                <div className="rms-form-group">
                  <label>Confirmer <span className="req">*</span></label>
                  <PwdInput value={form.confirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} onChange={e => set('confirmPassword', e.target.value)} placeholder="Répéter le mot de passe" />
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Statut</div>
              <label className="rms-toggle-label">
                <span className="rms-toggle">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                  <span className="rms-toggle-slider" />
                </span>
                Compte actif dès la création
              </label>
            </div>

            <div className="rms-form-actions">
              <button type="button" className="rms-btn rms-btn-ghost" onClick={() => navigate('/admin/admins')}>Annuler</button>
              <button type="submit" className="rms-btn rms-btn-primary" disabled={loading}>
                <Save size={16} />{loading ? 'Création…' : 'Créer l\'administrateur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AddAdmin;