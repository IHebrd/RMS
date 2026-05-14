// src/pages/adminPages/Admins.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Search, Plus, Edit2, Trash2, Power, Shield, AlertCircle, X } from 'lucide-react';
import './admin.css';

function Admins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchAdmins(); }, [search]);

  const token = () => localStorage.getItem('adminToken');
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const r = await fetch(`http://localhost:5000/api/admin/admins?search=${search}`, { headers: headers() });
      const d = await r.json();
      if (d.success) setAdmins(d.data.admins || []);
      else setError(d.message || 'Erreur de chargement');
    } catch { setError('Impossible de charger les administrateurs'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`http://localhost:5000/api/admin/admins/${deleteTarget.id}`, { method: 'DELETE', headers: headers() });
      setDeleteTarget(null);
      fetchAdmins();
    } catch { setError('Erreur lors de la suppression'); }
  };

  const handleToggle = async (admin) => {
    try {
      await fetch(`http://localhost:5000/api/admin/admins/${admin.id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ is_active: !admin.is_active }),
      });
      fetchAdmins();
    } catch { setError('Erreur lors de la modification'); }
  };

  const getInitials = (a) => `${a.first_name?.[0] || ''}${a.last_name?.[0] || ''}`.toUpperCase();

  return (
    <AdminLayout title="Administrateurs">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        {/* Header */}
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon"><Shield size={22} /></div>
            <div>
              <h1>Administrateurs</h1>
              <p>{admins.length} administrateur{admins.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => navigate('/admin/admins/new')}>
            <Plus size={18} /> Nouvel administrateur
          </button>
        </div>

        {error && (
          <div className="rms-alert rms-alert-error">
            <AlertCircle size={18} />{error}
            <button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}

        <div className="rms-toolbar">
          <div className="rms-search">
            <Search size={16} />
            <input placeholder="Rechercher un administrateur…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="rms-loader"><div className="rms-spinner" /><span>Chargement…</span></div>
        ) : (
          <div className="rms-table-wrap">
            <table className="rms-table">
              <thead>
                <tr>
                  <th>Administrateur</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>CIN</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr><td colSpan="6">
                    <div className="rms-empty">
                      <div className="rms-empty-icon"><Shield size={48} /></div>
                      <h3>Aucun administrateur trouvé</h3>
                      <p>Ajoutez le premier administrateur.</p>
                      <button className="rms-btn rms-btn-primary" onClick={() => navigate('/admin/admins/new')}>
                        <Plus size={18} /> Ajouter
                      </button>
                    </div>
                  </td></tr>
                ) : admins.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="rms-avatar" style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                          {getInitials(admin)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{admin.first_name} {admin.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Admin</div>
                        </div>
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>{admin.phone || <span style={{ color: '#475569' }}>—</span>}</td>
                    <td><code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>{admin.cin}</code></td>
                    <td>
                      <span className={`rms-badge ${admin.is_active ? 'rms-badge-active' : 'rms-badge-inactive'}`}>
                        <span className={`rms-dot ${admin.is_active ? 'rms-dot-green' : 'rms-dot-gray'}`} />
                        {admin.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="rms-btn-icon rms-btn" title="Modifier" onClick={() => navigate(`/admin/admins/edit/${admin.id}`)}><Edit2 size={16} /></button>
                        <button className="rms-btn-icon rms-btn" title={admin.is_active ? 'Désactiver' : 'Activer'} onClick={() => handleToggle(admin)} style={{ color: admin.is_active ? '#f87171' : '#34d399' }}><Power size={16} /></button>
                        <button className="rms-btn-icon rms-btn" title="Supprimer" onClick={() => setDeleteTarget(admin)} style={{ color: '#f87171' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {deleteTarget && (
          <div className="rms-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div className="rms-modal-icon danger"><Trash2 size={24} /></div>
              <h3>Supprimer l'administrateur ?</h3>
              <p>Supprimer <strong style={{ color: '#f1f5f9' }}>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ?</p>
              <p style={{ color: '#f87171', fontSize: '0.8rem' }}>⚠️ Cette action est irréversible.</p>
              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => setDeleteTarget(null)}>Annuler</button>
                <button className="rms-btn rms-btn-danger" onClick={handleDelete}>Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Admins;