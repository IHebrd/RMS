// src/pages/adminPages/Reclamations.js
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, Trash2, Eye, X, AlertCircle, Calendar, FileText, Zap, Laptop, Lock, Map, Wrench, Clipboard } from 'lucide-react';
import './admin.css';

const STATUS_MAP = {
  pending:     { label: 'En attente',  cls: 'rms-badge-pending',   dot: 'rms-dot-yellow' },
  in_progress: { label: 'En cours',    cls: 'rms-badge-progress',  dot: 'rms-dot-blue' },
  validated:   { label: 'Validée',     cls: 'rms-badge-validated', dot: 'rms-dot-green' },
  failed:      { label: 'Échouée',     cls: 'rms-badge-failed',    dot: 'rms-dot-red' },
  archived:    { label: 'Archivée',    cls: 'rms-badge-archived',  dot: 'rms-dot-gray' },
};

const URGENCY_MAP = {
  normal:      { label: 'Normal',      cls: 'rms-badge-active' },
  urgent:      { label: 'Urgent',      cls: 'rms-badge-pending' },
  tres_urgent: { label: 'Très urgent', cls: 'rms-badge-failed' },
};

const TYPE_ICONS = {
  electrique: <Zap size={14} />,
  numerique:  <Laptop size={14} />,
  securite:   <Lock size={14} />,
  voirie:     <Map size={14} />,
  plomberie:  <Wrench size={14} />,
  autre:      <Clipboard size={14} />,
};

function Reclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchReclamations(); }, [filter, search, page]);

  const token = () => localStorage.getItem('adminToken');
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const r = await fetch(
        `http://localhost:5000/api/reclamations?page=${page}&limit=10${statusParam}&search=${search}`,
        { headers: headers() }
      );
      const d = await r.json();
      if (d.success) {
        setReclamations(d.data.reclamations || []);
        setTotal(d.data.pagination?.total || 0);
        setTotalPages(d.data.pagination?.totalPages || 1);
      } else setError(d.message || 'Erreur');
    } catch { setError('Impossible de charger les réclamations'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`http://localhost:5000/api/reclamations/${deleteTarget.id}`, { method: 'DELETE', headers: headers() });
      setDeleteTarget(null);
      fetchReclamations();
    } catch { setError('Erreur lors de la suppression'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const FILTERS = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'validated', label: 'Validées' },
    { key: 'failed', label: 'Échouées' },
    { key: 'archived', label: 'Archivées' },
  ];

  return (
    <AdminLayout title="Réclamations">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><FileText size={22} /></div>
            <div>
              <h1>Réclamations</h1>
              <p>{total} réclamation{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rms-alert rms-alert-error">
            <AlertCircle size={18} />{error}
            <button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}

        <div className="rms-toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="rms-filter-tabs">
            {FILTERS.map(f => (
              <button key={f.key} className={`rms-filter-tab${filter === f.key ? ' active' : ''}`}
                onClick={() => { setFilter(f.key); setPage(1); }}>{f.label}
              </button>
            ))}
          </div>
          <div className="rms-search" style={{ maxWidth: '280px' }}>
            <Search size={16} />
            <input placeholder="Rechercher…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {loading ? (
          <div className="rms-loader"><div className="rms-spinner" /><span>Chargement…</span></div>
        ) : (
          <div className="rms-table-wrap">
            <table className="rms-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Urgence</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reclamations.length === 0 ? (
                  <tr><td colSpan="7">
                    <div className="rms-empty">
                      <div className="rms-empty-icon"><FileText size={48} /></div>
                      <h3>Aucune réclamation trouvée</h3>
                      <p>Modifiez vos filtres ou attendez de nouvelles soumissions.</p>
                    </div>
                  </td></tr>
                ) : reclamations.map(rec => {
                  const s = STATUS_MAP[rec.status] || STATUS_MAP.pending;
                  const u = URGENCY_MAP[rec.urgency] || URGENCY_MAP.normal;
                  return (
                    <tr key={rec.id}>
                      <td><code style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>{rec.reference || `#${rec.id}`}</code></td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#f1f5f9', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</div>
                        {rec.description && <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.description}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
                          {TYPE_ICONS[rec.type] || <Clipboard size={14} />} {rec.type || '—'}
                        </span>
                      </td>
                      <td><span className={`rms-badge ${u.cls}`}>{u.label}</span></td>
                      <td><span className={`rms-badge ${s.cls}`}><span className={`rms-dot ${s.dot}`} />{s.label}</span></td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                          <Calendar size={13} />
                          {fmtDate(rec.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="rms-btn-icon rms-btn" title="Voir" onClick={() => setSelected(rec)}><Eye size={16} /></button>
                          <button className="rms-btn-icon rms-btn" title="Supprimer" onClick={() => setDeleteTarget(rec)} style={{ color: '#f87171' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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

        {/* Detail modal */}
        {selected && (
          <div className="rms-modal-overlay" onClick={() => setSelected(null)}>
            <div className="rms-modal rms-modal-lg" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <code style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>{selected.reference || `#${selected.id}`}</code>
                  <h3 style={{ marginTop: '10px' }}>{selected.title}</h3>
                </div>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => setSelected(null)}><X size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  ['Type', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{TYPE_ICONS[selected.type] || <Clipboard size={14} />} {selected.type || '—'}</span>],
                  ['Urgence', URGENCY_MAP[selected.urgency]?.label || '—'],
                  ['Statut', STATUS_MAP[selected.status]?.label || selected.status],
                  ['Date création', fmtDate(selected.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="rms-detail-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="rms-detail-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{label}</span>
                    <span className="rms-detail-value" style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: '500' }}>{value}</span>
                  </div>
                ))}
              </div>
              {selected.description && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</p>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>{selected.description}</p>
                </div>
              )}
              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-danger" onClick={() => { setDeleteTarget(selected); setSelected(null); }}><Trash2 size={16} /> Supprimer</button>
                <button className="rms-btn rms-btn-ghost" onClick={() => setSelected(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete modal */}
        {deleteTarget && (
          <div className="rms-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div className="rms-modal-icon danger"><Trash2 size={24} /></div>
              <h3>Supprimer la réclamation ?</h3>
              <p>Supprimer <strong style={{ color: '#f1f5f9' }}>{deleteTarget.title}</strong> ?</p>
              <p style={{ color: '#f87171', fontSize: '0.8rem' }}>⚠️ Action irréversible.</p>
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

export default Reclamations;