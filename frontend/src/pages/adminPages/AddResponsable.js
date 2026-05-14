// src/pages/adminPages/AddResponsable.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Users, Save, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import './admin.css';

function AddResponsable() {
  const navigate = useNavigate();
  const { id: orgId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingOrg, setFetchingOrg] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', phone: '', cin: '',
    organization_id: orgId || '', position: '', is_active: true
  });

  useEffect(() => {
    if (orgId) fetchOrganization();
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      setFetchingOrg(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/organizations/${orgId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setOrganization(data.data);
        setFormData(prev => ({ ...prev, organization_id: parseInt(orgId) }));
      } else {
        setError('Organisation non trouvée');
      }
    } catch (err) {
      setError('Impossible de charger l\'organisation');
    } finally {
      setFetchingOrg(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);

    if (!formData.email.trim()) { setError('L\'email est requis'); setLoading(false); return; }
    if (!formData.password) { setError('Le mot de passe est requis'); setLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); setLoading(false); return; }
    if (formData.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); setLoading(false); return; }
    if (!formData.first_name.trim()) { setError('Le prénom est requis'); setLoading(false); return; }
    if (!formData.last_name.trim()) { setError('Le nom est requis'); setLoading(false); return; }
    if (!formData.cin.trim()) { setError('Le CIN est requis'); setLoading(false); return; }

    const dataToSend = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim() || null,
      cin: formData.cin.trim(),
      organization_id: parseInt(formData.organization_id),
      position: formData.position.trim() || null,
      is_active: formData.is_active
    };

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/responsables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();

      if (response.status === 201 || response.ok) {
        setSuccess(true);
        setTimeout(() => navigate(`/admin/organizations/${orgId}/responsables`), 2000);
      } else {
        setError(data.message || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Impossible de créer le responsable');
    } finally {
      setLoading(false);
    }
  };

  const PwdInput = ({ value, show, onToggle, onChange, placeholder, name }) => (
    <div style={{ position: 'relative' }}>
      <input
        className="rms-input"
        type={show ? 'text' : 'password'}
        name={name}
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

  if (fetchingOrg) return <AdminLayout title="Ajouter un responsable"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement...</span></div></AdminLayout>;

  return (
    <AdminLayout title="Ajouter un responsable">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate(orgId ? `/admin/organizations/${orgId}/responsables` : '/admin/organizations')}><ArrowLeft size={16} /> Retour</button>

        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Users size={22} /></div>
            <div>
              <h1>Ajouter un responsable</h1>
              <p>{organization ? `Pour l'organisation : ${organization.name}` : 'Remplissez les informations du responsable'}</p>
            </div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}</div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />Responsable créé avec succès ! Redirection...</div>}

        <div className="rms-form-card">
          <form onSubmit={handleSubmit}>
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations personnelles</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Prénom <span className="req">*</span></label>
                  <input className="rms-input" type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="rms-form-group">
                  <label>Nom <span className="req">*</span></label>
                  <input className="rms-input" type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>CIN <span className="req">*</span></label>
                  <input className="rms-input" type="text" name="cin" value={formData.cin} onChange={handleChange} required />
                </div>
                <div className="rms-form-group">
                  <label>Téléphone</label>
                  <input className="rms-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="rms-form-group">
                <label>Poste / Fonction</label>
                <input className="rms-input" type="text" name="position" value={formData.position} onChange={handleChange} />
              </div>
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations de connexion</div>
              <div className="rms-form-group">
                <label>Email <span className="req">*</span></label>
                <input className="rms-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Mot de passe <span className="req">*</span></label>
                  <PwdInput name="password" value={formData.password} show={showPwd} onToggle={() => setShowPwd(!showPwd)} onChange={handleChange} placeholder="Minimum 6 caractères" />
                </div>
                <div className="rms-form-group">
                  <label>Confirmer <span className="req">*</span></label>
                  <PwdInput name="confirmPassword" value={formData.confirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} onChange={handleChange} placeholder="Répéter le mot de passe" />
                </div>
              </div>
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Statut</div>
              <label className="rms-toggle-label">
                <span className="rms-toggle">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                  <span className="rms-toggle-slider" />
                </span>
                Activer le compte
              </label>
            </div>

            <div className="rms-form-actions">
              <button type="button" className="rms-btn rms-btn-ghost" onClick={() => navigate(orgId ? `/admin/organizations/${orgId}/responsables` : '/admin/organizations')}>Annuler</button>
              <button type="submit" className="rms-btn rms-btn-primary" disabled={loading}>
                <Save size={16} />{loading ? 'Création...' : 'Créer le responsable'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AddResponsable;