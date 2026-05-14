// src/pages/adminPages/EditAdmin.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Shield, Save, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './admin.css';

function EditAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', phone: '', cin: '', is_active: true });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { fetchAdmin(); }, [id]);

  const fetchAdmin = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/admins/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const admin = data.data;
        setFormData({ email: admin.email || '', first_name: admin.first_name || '', last_name: admin.last_name || '', phone: admin.phone || '', cin: admin.cin || '', is_active: admin.is_active !== undefined ? admin.is_active : true });
      } else { setError('Impossible de charger'); }
    } catch (err) { setError('Erreur'); }
    finally { setFetching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (showPassword && passwordData.password !== passwordData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const dataToSend = { email: formData.email, first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone, cin: formData.cin, is_active: formData.is_active };
      if (showPassword && passwordData.password) dataToSend.password = passwordData.password;
      
      const response = await fetch(`http://localhost:5000/api/admin/admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) { navigate('/admin/admins'); }
      else { const data = await response.json(); setError(data.message || 'Erreur'); }
    } catch (err) { setError('Erreur'); }
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
        style={{ paddingRight: '42px' }}
      />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0, width: '18px', height: '18px' }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  if (fetching) return <AdminLayout title="Modifier"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement...</span></div></AdminLayout>;

  return (
    <AdminLayout title="Modifier administrateur">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate('/admin/admins')}><ArrowLeft size={16} /> Retour</button>

        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Shield size={22} /></div>
            <div><h1>Modifier administrateur</h1><p>Mettre à jour le compte</p></div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}</div>}

        <div className="rms-form-card">
          <form onSubmit={handleSubmit}>
            {/* Identité */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations personnelles</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Prénom <span className="req">*</span></label>
                  <input className="rms-input" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                </div>
                <div className="rms-form-group">
                  <label>Nom <span className="req">*</span></label>
                  <input className="rms-input" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                </div>
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>CIN <span className="req">*</span></label>
                  <input className="rms-input" value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} required />
                </div>
                <div className="rms-form-group">
                  <label>Téléphone</label>
                  <input className="rms-input" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Connexion */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations de connexion</div>
              <div className="rms-form-group">
                <label>Email <span className="req">*</span></label>
                <input className="rms-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              
              <label className="rms-toggle-label" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <span className="rms-toggle">
                  <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                  <span className="rms-toggle-slider" />
                </span>
                Changer le mot de passe
              </label>

              {showPassword && (
                <div className="rms-form-row">
                  <div className="rms-form-group">
                    <label>Mot de passe</label>
                    <PwdInput value={passwordData.password} show={showPwd} onToggle={() => setShowPwd(!showPwd)} onChange={e => setPasswordData({...passwordData, password: e.target.value})} placeholder="Nouveau mot de passe" />
                  </div>
                  <div className="rms-form-group">
                    <label>Confirmer</label>
                    <PwdInput value={passwordData.confirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="Répéter le mot de passe" />
                  </div>
                </div>
              )}
            </div>

            {/* Statut */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Statut</div>
              <label className="rms-toggle-label">
                <span className="rms-toggle">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <span className="rms-toggle-slider" />
                </span>
                Compte actif
              </label>
            </div>

            <div className="rms-form-actions">
              <button type="button" className="rms-btn rms-btn-ghost" onClick={() => navigate('/admin/admins')}>Annuler</button>
              <button type="submit" className="rms-btn rms-btn-primary" disabled={loading}>
                <Save size={16} />{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default EditAdmin;