// src/pages/responsablesPages/ResponsableReclamations.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsableLayout from '../../components/ResponsableLayout';
import { FileText, Search, X, CheckCircle, AlertCircle, Phone, User, Monitor, Wrench, Settings, FileBox } from 'lucide-react';
import '../adminPages/admin.css';

const TYPE_CONFIG = {
  technique: { icon: <Wrench size={14} />, label: 'Technique', color: '#0ea5e9' },
  maintenance: { icon: <Settings size={14} />, label: 'Maintenance', color: '#f59e0b' },
  informatique: { icon: <Monitor size={14} />, label: 'Informatique', color: '#8b5cf6' },
  general: { icon: <FileBox size={14} />, label: 'Général', color: '#64748b' }
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', class: 'rms-badge-inactive', dot: 'rms-dot-gray' },
  in_progress: { label: 'En cours', class: 'rms-badge-active', dot: 'rms-dot-blue', overrideColor: '#3b82f6', overrideBg: 'rgba(59,130,246,0.1)' },
  resolved: { label: 'Résolue', class: 'rms-badge-active', dot: 'rms-dot-green' },
  rejected: { label: 'Rejetée', class: 'rms-badge-error', dot: 'rms-dot-red', overrideColor: '#ef4444', overrideBg: 'rgba(239,68,68,0.1)' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: 'Moyenne', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'Haute', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
};

function ResponsableReclamations() {
  const navigate = useNavigate();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });

  useEffect(() => { fetchReclamations(); }, []);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/reclamations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReclamations(data.data.reclamations || []);
      } else {
        setReclamations([
          { id: 1, title: 'Problème d\'électricité', description: 'Coupure d\'électricité dans le bureau principal depuis 2 jours', type: 'technique', priority: 'high', status: 'pending', created_at: '2024-01-15T10:00:00Z', client_name: 'SARL Tunisie', client_phone: '50123456', amount: 1500 },
          { id: 2, title: 'Problème de plomberie', description: 'Fuite d\'eau dans les toilettes', type: 'maintenance', priority: 'medium', status: 'in_progress', created_at: '2024-01-14T14:30:00Z', client_name: 'Société ABC', client_phone: '52345678', amount: 800 },
          { id: 3, title: 'Problème informatique', description: 'Panne du réseau internet', type: 'informatique', priority: 'high', status: 'resolved', created_at: '2024-01-13T09:15:00Z', client_name: 'Startup XYZ', client_phone: '54321098', amount: 2000 },
        ]);
      }
    } catch (err) {
      setError('Impossible de charger les réclamations');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedReclamation) return;
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch(`http://localhost:5000/api/responsable/reclamations/${selectedReclamation.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: statusUpdate.status, notes: statusUpdate.notes })
      });

      if (response.ok) {
        setSuccess(`Statut mis à jour avec succès`);
        setTimeout(() => setSuccess(''), 3000);
        setShowStatusModal(false);
        setStatusUpdate({ status: '', notes: '' });
        fetchReclamations();
      } else {
        setError('Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filteredReclamations = reclamations.filter(recla => {
    const matchesSearch = recla.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recla.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recla.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || recla.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reclamations.length,
    pending: reclamations.filter(r => r.status === 'pending').length,
    in_progress: reclamations.filter(r => r.status === 'in_progress').length,
    resolved: reclamations.filter(r => r.status === 'resolved').length
  };

  if (loading) return <ResponsableLayout title="Réclamations"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des réclamations...</span></div></ResponsableLayout>;

  return (
    <ResponsableLayout title="Gestion des Réclamations">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}><FileText size={22} /></div>
            <div>
              <h1>Gestion des Réclamations</h1>
              <p>Traitez et suivez les demandes</p>
            </div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />{success}<button className="rms-alert-close" onClick={() => setSuccess('')}><X size={18} /></button></div>}

        <div className="rms-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #64748b' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pending}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>En attente</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #0ea5e9' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.in_progress}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>En cours</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.resolved}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Résolues</div></div>
        </div>

        <div className="rms-toolbar">
          <div className="rms-search" style={{ maxWidth: '300px' }}>
            <Search size={16} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="rms-filters" style={{ display: 'flex', gap: '8px' }}>
            <button className={`rms-btn rms-btn-ghost ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')} style={filterStatus === 'all' ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}>Toutes</button>
            <button className={`rms-btn rms-btn-ghost ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')} style={filterStatus === 'pending' ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}>En attente</button>
            <button className={`rms-btn rms-btn-ghost ${filterStatus === 'in_progress' ? 'active' : ''}`} onClick={() => setFilterStatus('in_progress')} style={filterStatus === 'in_progress' ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}>En cours</button>
            <button className={`rms-btn rms-btn-ghost ${filterStatus === 'resolved' ? 'active' : ''}`} onClick={() => setFilterStatus('resolved')} style={filterStatus === 'resolved' ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}>Résolues</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredReclamations.length === 0 ? (
            <div className="rms-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="rms-empty-icon"><FileText size={48} /></div>
              <h3>Aucune réclamation trouvée</h3>
            </div>
          ) : filteredReclamations.map(recla => {
            const statusConf = STATUS_CONFIG[recla.status] || STATUS_CONFIG.pending;
            const prioConf = PRIORITY_CONFIG[recla.priority] || PRIORITY_CONFIG.medium;
            const typeConf = TYPE_CONFIG[recla.type] || TYPE_CONFIG.general;

            return (
              <div key={recla.id} className="rms-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s', borderTop: `3px solid ${prioConf.color}` }} onClick={() => { setSelectedReclamation(recla); setShowDetailModal(true); }} onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform='none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' }}>{recla.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(recla.created_at)}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', background: prioConf.bg, color: prioConf.color }}>
                    {prioConf.label}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', flex: 1 }}>{recla.description.length > 90 ? recla.description.substring(0, 90) + '...' : recla.description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: typeConf.color }} title={typeConf.label}>{typeConf.icon} {typeConf.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#94a3b8' }}><User size={14} /> {recla.client_name || 'Client'}</span>
                  </div>
                  <span className={`rms-badge ${statusConf.class}`} style={statusConf.overrideColor ? { color: statusConf.overrideColor, background: statusConf.overrideBg } : {}}>
                    <span className={`rms-dot ${statusConf.dot}`} /> {statusConf.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedReclamation && (
          <div className="rms-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="rms-modal rms-modal-lg" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>{selectedReclamation.title}</h2>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Soumise le {formatDate(selectedReclamation.created_at)}</div>
                </div>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => setShowDetailModal(false)}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</div>
                  {(() => {
                    const s = STATUS_CONFIG[selectedReclamation.status] || STATUS_CONFIG.pending;
                    return <span className={`rms-badge ${s.class}`} style={s.overrideColor ? { color: s.overrideColor, background: s.overrideBg } : {}}><span className={`rms-dot ${s.dot}`} /> {s.label}</span>;
                  })()}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priorité</div>
                  {(() => {
                    const p = PRIORITY_CONFIG[selectedReclamation.priority] || PRIORITY_CONFIG.medium;
                    return <span style={{ fontSize: '0.85rem', fontWeight: '600', color: p.color }}>{p.label}</span>;
                  })()}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
                  {(() => {
                    const t = TYPE_CONFIG[selectedReclamation.type] || TYPE_CONFIG.general;
                    return <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#f1f5f9' }}>{t.icon} {t.label}</span>;
                  })()}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', marginBottom: '10px' }}>DESCRIPTION</div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', fontSize: '0.95rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                  {selectedReclamation.description}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                <div className="rms-form-group">
                  <label><User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/> Client</label>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', color: '#f8fafc', fontWeight: '500' }}>{selectedReclamation.client_name || 'Non spécifié'}</div>
                </div>
                <div className="rms-form-group">
                  <label><Phone size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/> Téléphone</label>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', color: '#f8fafc' }}>{selectedReclamation.client_phone || 'Non spécifié'}</div>
                </div>
                <div className="rms-form-group">
                  <label>Montant (TND)</label>
                  <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '8px', fontWeight: '600' }}>{selectedReclamation.amount || 0} TND</div>
                </div>
              </div>

              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => setShowDetailModal(false)}>Fermer</button>
                {selectedReclamation.status !== 'resolved' && selectedReclamation.status !== 'rejected' && (
                  <button className="rms-btn rms-btn-primary" onClick={() => {
                    setShowDetailModal(false);
                    setStatusUpdate({ status: selectedReclamation.status === 'pending' ? 'in_progress' : 'resolved', notes: '' });
                    setShowStatusModal(true);
                  }}>
                    Changer le statut
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {showStatusModal && selectedReclamation && (
          <div className="rms-modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Changer le statut</h3>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => setShowStatusModal(false)}><X size={20} /></button>
              </div>

              <div className="rms-form-group">
                <label>Nouveau statut</label>
                <select className="rms-input" value={statusUpdate.status} onChange={e => setStatusUpdate({...statusUpdate, status: e.target.value})}>
                  <option value="">Sélectionner un statut...</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolue</option>
                  <option value="rejected">Rejetée</option>
                </select>
              </div>

              <div className="rms-form-group" style={{ marginTop: '16px' }}>
                <label>Notes (optionnel)</label>
                <textarea 
                  className="rms-input" 
                  rows="3" 
                  style={{ resize: 'vertical' }}
                  value={statusUpdate.notes} 
                  onChange={e => setStatusUpdate({...statusUpdate, notes: e.target.value})} 
                  placeholder="Ajoutez des notes sur ce changement..." 
                />
              </div>

              <div className="rms-modal-actions" style={{ marginTop: '24px' }}>
                <button className="rms-btn rms-btn-ghost" onClick={() => setShowStatusModal(false)}>Annuler</button>
                <button className="rms-btn rms-btn-primary" onClick={updateStatus} disabled={!statusUpdate.status}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsableLayout>
  );
}

export default ResponsableReclamations;