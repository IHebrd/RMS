// src/pages/adminPages/Organizations.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Search, Plus, Edit2, Trash2, Power, Building2, AlertCircle, Users, X } from 'lucide-react';
import './admin.css';

const TYPE_MAP = {
  private: { label: 'Privée', cls: 'rms-badge-private' },
  public: { label: 'Publique', cls: 'rms-badge-public' },
  association: { label: 'Association', cls: 'rms-badge-assoc' },
};

function Organizations() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchOrgs(); }, [page, search]);

  const token = () => localStorage.getItem('adminToken');
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const r = await fetch(`http://localhost:5000/api/admin/organizations?page=${page}&limit=10&search=${search}`, { headers: headers() });
      const d = await r.json();
      if (d.success) {
        setOrgs(d.data.organizations || []);
        setTotalPages(d.data.pagination?.totalPages || 1);
        setTotal(d.data.pagination?.total || 0);
      } else setError(d.message || 'Erreur de chargement');
    } catch { setError('Impossible de charger les organisations'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`http://localhost:5000/api/admin/organizations/${deleteTarget.id}`, { method: 'DELETE', headers: headers() });
      setDeleteTarget(null);
      fetchOrgs();
    } catch { setError('Erreur lors de la suppression'); }
  };

  const handleToggle = async (org) => {
    try {
      await fetch(`http://localhost:5000/api/admin/organizations/${org.id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ is_active: !org.is_active }),
      });
      fetchOrgs();
    } catch { setError('Erreur lors de la modification'); }
  };

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??';

  return (
    <AdminLayout title="Organisations">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        {/* Header */}
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon"><Building2 size={22} /></div>
            <div>
              <h1>Organisations</h1>
              <p>{total} organisation{total !== 1 ? 's' : ''} au total</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => navigate('/admin/organizations/new')}>
            <Plus size={18} /> Nouvelle organisation
          </button>
        </div>

        {/* Alert */}
        {error && (
          <div className="rms-alert rms-alert-error">
            <AlertCircle size={18} />{error}
            <button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}

        {/* Toolbar */}
        <div className="rms-toolbar">
          <div className="rms-search">
            <Search size={16} />
            <input placeholder="Rechercher une organisation…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rms-loader"><div className="rms-spinner" /><span>Chargement…</span></div>
        ) : (
          <div className="rms-table-wrap">
            <table className="rms-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Gouvernorat</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.length === 0 ? (
                  <tr><td colSpan="7">
                    <div className="rms-empty">
                      <div className="rms-empty-icon"><Building2 size={48} /></div>
                      <h3>Aucune organisation trouvée</h3>
                      <p>Commencez par en créer une.</p>
                      <button className="rms-btn rms-btn-primary" onClick={() => navigate('/admin/organizations/new')}>
                        <Plus size={18} /> Créer une organisation
                      </button>
                    </div>
                  </td></tr>
                ) : orgs.map(org => (
                  <tr key={org.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="rms-avatar" style={{ borderRadius: '8px', cursor: 'pointer', width: '40px', height: '40px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }} onClick={() => navigate(`/admin/organizations/${org.id}/responsables`)}>
                          {org.logo ? <img src={org.logo} alt={org.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} /> : getInitials(org.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#f1f5f9', cursor: 'pointer' }} onClick={() => navigate(`/admin/organizations/${org.id}/responsables`)}>
                            {org.name}
                          </div>
                          {org.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{org.description.slice(0, 45)}{org.description.length > 45 ? '…' : ''}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className={`rms-badge ${TYPE_MAP[org.type]?.cls || 'rms-badge-inactive'}`}>{TYPE_MAP[org.type]?.label || org.type}</span></td>
                    <td>{org.email || <span style={{ color: '#475569' }}>—</span>}</td>
                    <td>{org.phone || <span style={{ color: '#475569' }}>—</span>}</td>
                    <td>{org.governorate || <span style={{ color: '#475569' }}>—</span>}</td>
                    <td>
                      <span className={`rms-badge ${org.is_active ? 'rms-badge-active' : 'rms-badge-inactive'}`}>
                        <span className={`rms-dot ${org.is_active ? 'rms-dot-green' : 'rms-dot-gray'}`} />
                        {org.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="rms-btn-icon rms-btn" title="Responsables" onClick={() => navigate(`/admin/organizations/${org.id}/responsables`)}>
                          <Users size={16} />
                        </button>
                        <button className="rms-btn-icon rms-btn" title="Modifier" onClick={() => navigate(`/admin/organizations/edit/${org.id}`)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="rms-btn-icon rms-btn" title={org.is_active ? 'Désactiver' : 'Activer'} onClick={() => handleToggle(org)} style={{ color: org.is_active ? '#f87171' : '#34d399' }}>
                          <Power size={16} />
                        </button>
                        <button className="rms-btn-icon rms-btn" title="Supprimer" onClick={() => setDeleteTarget(org)} style={{ color: '#f87171' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="rms-pagination">
            <span>Page {page} sur {totalPages} — {total} résultats</span>
            <div className="rms-pagination-btns">
              <button className="rms-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                <button key={n} className={`rms-page-btn${n === page ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="rms-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}

        {/* Delete modal */}
        {deleteTarget && (
          <div className="rms-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div className="rms-modal-icon danger"><Trash2 size={24} /></div>
              <h3>Supprimer l'organisation ?</h3>
              <p>Vous êtes sur le point de supprimer <strong style={{ color: '#f1f5f9' }}>{deleteTarget.name}</strong>.</p>
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

export default Organizations;