// src/pages/adminPages/OrganizationResponsables.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Users, Plus, Edit2, Power, ArrowLeft, AlertCircle, X, Mail, Phone, MapPin } from 'lucide-react';
import './admin.css';

function OrganizationResponsables() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, [id]);

  const token = () => localStorage.getItem('adminToken');
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgR, respR] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/organizations/${id}`, { headers: headers() }),
        fetch(`http://localhost:5000/api/admin/responsables?organization_id=${id}`, { headers: headers() }),
      ]);
      const [orgD, respD] = await Promise.all([orgR.json(), respR.json()]);
      if (orgD.success) setOrg(orgD.data);
      if (respD.success) setResponsables(respD.data.responsables || []);
    } catch { setError('Impossible de charger les données'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (resp) => {
    try {
      await fetch(`http://localhost:5000/api/admin/responsables/${resp.id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ is_active: !resp.is_active }),
      });
      fetchData();
    } catch { setError('Erreur lors de la modification'); }
  };

  const getInitials = (r) => `${r.first_name?.[0] || ''}${r.last_name?.[0] || ''}`.toUpperCase();

  if (loading) return (
    <AdminLayout title="Responsables">
      <div className="rms-loader"><div className="rms-spinner" /><span>Chargement…</span></div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={`Responsables — ${org?.name || ''}`}>
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <button className="rms-btn rms-btn-ghost" style={{ marginBottom: '20px' }} onClick={() => navigate('/admin/organizations')}><ArrowLeft size={16} /> Retour aux organisations</button>

        {/* Org info card */}
        {org && (
          <div className="rms-card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div className="rms-avatar" style={{ width: '56px', height: '56px', borderRadius: '12px', fontSize: '1.1rem', background: 'linear-gradient(135deg,#6366f1,#0ea5e9)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              {org.logo ? <img src={org.logo} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} /> : org.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#f1f5f9', marginBottom: '4px' }}>{org.name}</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {org.email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}><Mail size={13} />{org.email}</span>}
                {org.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}><Phone size={13} />{org.phone}</span>}
                {org.governorate && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}><MapPin size={13} />{org.governorate}</span>}
              </div>
            </div>
            <button className="rms-btn rms-btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => navigate(`/admin/organizations/edit/${id}`)}>
              <Edit2 size={16} /> Modifier l'organisation
            </button>
          </div>
        )}

        {/* Header */}
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Users size={22} /></div>
            <div>
              <h1>Responsables</h1>
              <p>{responsables.length} responsable{responsables.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => navigate(`/admin/organizations/${id}/responsables/new`)}>
            <Plus size={18} /> Ajouter un responsable
          </button>
        </div>

        {error && (
          <div className="rms-alert rms-alert-error">
            <AlertCircle size={18} />{error}
            <button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}

        <div className="rms-table-wrap">
          <table className="rms-table">
            <thead>
              <tr>
                <th>Responsable</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>CIN</th>
                <th>Poste</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {responsables.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="rms-empty">
                    <div className="rms-empty-icon"><Users size={48} /></div>
                    <h3>Aucun responsable</h3>
                    <p>Ajoutez le premier responsable à cette organisation.</p>
                    <button className="rms-btn rms-btn-primary" onClick={() => navigate(`/admin/organizations/${id}/responsables/new`)}>
                      <Plus size={18} /> Ajouter
                    </button>
                  </div>
                </td></tr>
              ) : responsables.map(resp => (
                <tr key={resp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="rms-avatar" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{getInitials(resp)}</div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{resp.first_name} {resp.last_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Responsable</div>
                      </div>
                    </div>
                  </td>
                  <td>{resp.email}</td>
                  <td>{resp.phone || <span style={{ color: '#475569' }}>—</span>}</td>
                  <td><code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>{resp.cin}</code></td>
                  <td>{resp.position || <span style={{ color: '#475569' }}>—</span>}</td>
                  <td>
                    <span className={`rms-badge ${resp.is_active ? 'rms-badge-active' : 'rms-badge-inactive'}`}>
                      <span className={`rms-dot ${resp.is_active ? 'rms-dot-green' : 'rms-dot-gray'}`} />
                      {resp.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="rms-btn-icon rms-btn" title="Modifier" onClick={() => navigate(`/admin/responsables/edit/${resp.id}?orgId=${id}`)}><Edit2 size={16} /></button>
                      <button className="rms-btn-icon rms-btn" title={resp.is_active ? 'Désactiver' : 'Activer'} onClick={() => handleToggle(resp)} style={{ color: resp.is_active ? '#f87171' : '#34d399' }}><Power size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default OrganizationResponsables;