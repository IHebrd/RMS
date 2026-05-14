// src/pages/adminPages/EditResponsable.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Users, Save, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './admin.css';

function EditResponsable() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '', first_name: '', last_name: '',
    phone: '', cin: '', position: '', is_active: true
  });

  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

  useEffect(() => { fetchResponsable(); }, [id]);

  const fetchResponsable = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/responsables?page=1&limit=500`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur de chargement');

      const list = data?.data?.responsables ?? data?.data ?? [];
      const resp = list.find((r) => String(r.id) === String(id));

      if (!resp) { setError(`Responsable #${id} introuvable`); return; }

      setFormData({
        email: resp.email || '', first_name: resp.first_name || '', last_name: resp.last_name || '',
        phone: resp.phone || '', cin: resp.cin || '', position: resp.position || '',
        is_active: resp.is_active !== undefined ? resp.is_active : true,
      });
    } catch (err) {
      setError(err.message || 'Erreur de chargement des données');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);

    if (!formData.email.trim()) { setError('L\'email est requis'); setLoading(false); return; }
    if (!formData.first_name.trim()) { setError('Le prénom est requis'); setLoading(false); return; }
    if (!formData.last_name.trim()) { setError('Le nom est requis'); setLoading(false); return; }
    if (!formData.cin.trim()) { setError('Le CIN est requis'); setLoading(false); return; }

    if (showPasswordFields) {
      if (!passwordData.password) { setError('Le nouveau mot de passe est requis'); setLoading(false); return; }
      if (passwordData.password !== passwordData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); setLoading(false); return; }
      if (passwordData.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); setLoading(false); return; }
    }

    const dataToSend = {
      email: formData.email.trim().toLowerCase(), first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(), phone: formData.phone.trim() || null,
      cin: formData.cin.trim(), position: formData.position.trim() || null,
      is_active: formData.is_active
    };

    if (showPasswordFields && passwordData.password) dataToSend.password = passwordData.password;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/responsables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate(-1), 2000);
      } else {
        setError(data.message || 'Erreur lors de la modification');
      }
    } catch (err) {
      setError('Impossible de modifier le responsable');
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
        style={{ paddingRight: '42px' }}
      />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0, width: '18px', height: '18px' }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  if (fetching) return <AdminLayout title="Modifier le responsable"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des données...</span></div></AdminLayout>;

  return (
    <AdminLayout title="Modifier le responsable">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate(-1)}><ArrowLeft size={16} /> Retour</button>

        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Users size={22} /></div>
            <div><h1>Modifier le responsable</h1><p>Modifiez les informations du responsable</p></div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}</div>}
        {success && <div className="rms-alert rms-alert-success"><AlertCircle size={18} />Responsable modifié avec succès ! Redirection...</div>}

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

              <label className="rms-toggle-label" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <span className="rms-toggle">
                  <input type="checkbox" checked={showPasswordFields} onChange={e => setShowPasswordFields(e.target.checked)} />
                  <span className="rms-toggle-slider" />
                </span>
                Changer le mot de passe
              </label>

              {showPasswordFields && (
                <div className="rms-form-row">
                  <div className="rms-form-group">
                    <label>Nouveau mot de passe</label>
                    <PwdInput name="password" value={passwordData.password} show={showPwd} onToggle={() => setShowPwd(!showPwd)} onChange={handlePasswordChange} placeholder="Minimum 6 caractères" />
                  </div>
                  <div className="rms-form-group">
                    <label>Confirmer le mot de passe</label>
                    <PwdInput name="confirmPassword" value={passwordData.confirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} onChange={handlePasswordChange} placeholder="Répétez le mot de passe" />
                  </div>
                </div>
              )}
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Statut</div>
              <label className="rms-toggle-label">
                <span className="rms-toggle">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                  <span className="rms-toggle-slider" />
                </span>
                Compte actif
              </label>
            </div>

            <div className="rms-form-actions">
              <button type="button" className="rms-btn rms-btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
              <button type="submit" className="rms-btn rms-btn-primary" disabled={loading}>
                <Save size={16} />{loading ? 'Modification...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default EditResponsable;