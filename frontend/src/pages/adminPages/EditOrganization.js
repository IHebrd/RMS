// src/pages/adminPages/EditOrganization.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Building2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import './admin.css';

const GOVERNORATES = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Le Kef','Siliana','Kairouan','Kasserine','Sidi Bouzid','Sousse','Monastir','Mahdia','Sfax','Gafsa','Tozeur','Kebili','Gabès','Médenine','Tataouine'];

function EditOrganization() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', type: 'private', description: '', logo: '',
    governorate: '', delegation: '', postal_code: '', address: '',
    phone: '', email: '', website: '', is_active: true
  });

  useEffect(() => { fetchOrganization(); }, [id]);

  const fetchOrganization = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/organizations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const org = data.data;
        setFormData({
          name: org.name || '',
          type: org.type || 'private',
          description: org.description || '',
          logo: org.logo || '',
          governorate: org.governorate || '',
          delegation: org.delegation || '',
          postal_code: org.postal_code || '',
          address: org.address || '',
          phone: org.phone || '',
          email: org.email || '',
          website: org.website || '',
          is_active: org.is_active !== undefined ? org.is_active : true
        });
      } else {
        setError(data.message || 'Impossible de charger l\'organisation');
      }
    } catch (err) {
      setError('Erreur de chargement des données');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);

    if (!formData.name.trim()) { setError('Le nom de l\'organisation est requis'); setLoading(false); return; }
    if (!formData.email.trim()) { setError('L\'email est requis'); setLoading(false); return; }
    if (!formData.phone.trim()) { setError('Le téléphone est requis'); setLoading(false); return; }

    const cleanData = {
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim() || null,
      logo: formData.logo.trim() || null,
      governorate: formData.governorate.trim() || null,
      delegation: formData.delegation.trim() || null,
      postal_code: formData.postal_code.trim() || null,
      address: formData.address.trim() || null,
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      website: formData.website.trim() || null,
      is_active: formData.is_active
    };

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(cleanData)
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/admin/organizations'), 2000);
      } else {
        setError(data.message || 'Erreur lors de la modification');
      }
    } catch (err) {
      setError('Impossible de modifier l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <AdminLayout title="Modifier l'organisation"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des données...</span></div></AdminLayout>;

  return (
    <AdminLayout title="Modifier l'organisation">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate('/admin/organizations')}><ArrowLeft size={16} /> Retour aux organisations</button>

        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon"><Building2 size={22} /></div>
            <div><h1>Modifier l'organisation</h1><p>Modifiez les informations de l'organisation</p></div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}</div>}
        {success && <div className="rms-alert rms-alert-success"><AlertCircle size={18} />Organisation modifiée avec succès ! Redirection...</div>}

        <div className="rms-form-card">
          <form onSubmit={handleSubmit}>
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations générales</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Nom <span className="req">*</span></label>
                  <input className="rms-input" type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="rms-form-group">
                  <label>Type d'organisation</label>
                  <select className="rms-select" name="type" value={formData.type} onChange={handleChange}>
                    <option value="private">Privée</option>
                    <option value="public">Publique</option>
                    <option value="association">Association</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>
              </div>

              <div className="rms-form-group">
                <label>Description</label>
                <textarea className="rms-textarea" name="description" value={formData.description} onChange={handleChange} rows="3" />
              </div>
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Logo de l'organisation</div>
              <div className="rms-form-group">
                <label>URL du logo</label>
                <input className="rms-input" type="text" name="logo" value={formData.logo} onChange={handleChange} placeholder="https://example.com/logo.png" />
                {formData.logo && <img src={formData.logo} alt="Preview" style={{ marginTop: '8px', height: '48px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} onError={e => e.target.style.display = 'none'} />}
              </div>
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Adresse</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Gouvernorat</label>
                  <select className="rms-select" name="governorate" value={formData.governorate} onChange={handleChange}>
                    <option value="">Sélectionnez un gouvernorat</option>
                    {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                  </select>
                </div>
                <div className="rms-form-group">
                  <label>Délégation</label>
                  <input className="rms-input" type="text" name="delegation" value={formData.delegation} onChange={handleChange} />
                </div>
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Code postal</label>
                  <input className="rms-input" type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} />
                </div>
                <div className="rms-form-group">
                  <label>Adresse</label>
                  <input className="rms-input" type="text" name="address" value={formData.address} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Coordonnées</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Téléphone <span className="req">*</span></label>
                  <input className="rms-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="rms-form-group">
                  <label>Email <span className="req">*</span></label>
                  <input className="rms-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="rms-form-group">
                <label>Site web</label>
                <input className="rms-input" type="text" name="website" value={formData.website} onChange={handleChange} />
              </div>
            </div>

            <div className="rms-form-section">
              <div className="rms-form-section-title">Statut</div>
              <label className="rms-toggle-label">
                <span className="rms-toggle">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                  <span className="rms-toggle-slider" />
                </span>
                Organisation active
              </label>
            </div>

            <div className="rms-form-actions">
              <button type="button" className="rms-btn rms-btn-ghost" onClick={() => navigate('/admin/organizations')}>Annuler</button>
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

export default EditOrganization;