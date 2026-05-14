// src/pages/adminPages/AddOrganization.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Building2, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import './admin.css';

const GOVERNORATES = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Le Kef','Siliana','Kairouan','Kasserine','Sidi Bouzid','Sousse','Monastir','Mahdia','Sfax','Gafsa','Tozeur','Kebili','Gabès','Médenine','Tataouine'];

function AddOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'private', description: '', logo: '',
    governorate: '', delegation: '', postal_code: '', address: '',
    phone: '', email: '', website: '', is_active: true,
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Le nom est requis");
    if (!form.email.trim()) return setError("L'email est requis");
    if (!form.phone.trim()) return setError("Le téléphone est requis");

    setLoading(true); setError(''); setSuccess(false);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(), type: form.type,
          description: form.description.trim() || null,
          logo: form.logo.trim() || null,
          governorate: form.governorate || null,
          delegation: form.delegation.trim() || null,
          postal_code: form.postal_code.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          website: form.website.trim() || null,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/admin/organizations'), 1500); }
      else setError(data.message || data.error?.message || `Erreur ${res.status}`);
    } catch { setError('Impossible de contacter le serveur.'); }
    finally { setLoading(false); }
  };

  return (
    <AdminLayout title="Nouvelle organisation">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate('/admin/organizations')}><ArrowLeft size={16} /> Retour aux organisations</button>

        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon"><Building2 size={22} /></div>
            <div><h1>Nouvelle organisation</h1><p>Remplissez les informations ci-dessous</p></div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}</div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />Organisation créée avec succès ! Redirection…</div>}

        <div className="rms-form-card">
          <form onSubmit={handleSubmit}>
            {/* Informations générales */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Informations générales</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Nom <span className="req">*</span></label>
                  <input className="rms-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex : ABC Corporation" required />
                </div>
                <div className="rms-form-group">
                  <label>Type</label>
                  <select className="rms-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="private">Privée</option>
                    <option value="public">Publique</option>
                    <option value="association">Association</option>
                  </select>
                </div>
              </div>
              <div className="rms-form-group">
                <label>Description</label>
                <textarea className="rms-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description de l'organisation…" rows={3} />
              </div>
              <div className="rms-form-group">
                <label>URL du logo</label>
                <input className="rms-input" type="url" value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="https://example.com/logo.png" />
                {form.logo && <img src={form.logo} alt="Preview" style={{ marginTop: '8px', height: '48px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} onError={e => e.target.style.display = 'none'} />}
              </div>
            </div>

            {/* Adresse */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Adresse</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Gouvernorat</label>
                  <select className="rms-select" value={form.governorate} onChange={e => set('governorate', e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="rms-form-group">
                  <label>Délégation</label>
                  <input className="rms-input" value={form.delegation} onChange={e => set('delegation', e.target.value)} placeholder="Ex : Tunis Centre" />
                </div>
              </div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Code postal</label>
                  <input className="rms-input" value={form.postal_code} onChange={e => set('postal_code', e.target.value)} placeholder="Ex : 1000" />
                </div>
                <div className="rms-form-group">
                  <label>Adresse</label>
                  <input className="rms-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex : 123 Rue Habib Bourguiba" />
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="rms-form-section">
              <div className="rms-form-section-title">Coordonnées</div>
              <div className="rms-form-row">
                <div className="rms-form-group">
                  <label>Téléphone <span className="req">*</span></label>
                  <input className="rms-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Ex : 71234567" required />
                </div>
                <div className="rms-form-group">
                  <label>Email <span className="req">*</span></label>
                  <input className="rms-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@organisation.com" required />
                </div>
              </div>
              <div className="rms-form-group">
                <label>Site web</label>
                <input className="rms-input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://www.organisation.com" />
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
                Activer l'organisation dès la création
              </label>
            </div>

            <div className="rms-form-actions">
              <button type="button" className="rms-btn rms-btn-ghost" onClick={() => navigate('/admin/organizations')}>Annuler</button>
              <button type="submit" className="rms-btn rms-btn-primary" disabled={loading}>
                <Save size={16} />{loading ? 'Création…' : "Créer l'organisation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AddOrganization;