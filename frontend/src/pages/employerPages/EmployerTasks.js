// src/pages/employerPages/EmployerTasks.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/EmployerLayout';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Paperclip, 
  Play, 
  Check, 
  X, 
  Calendar, 
  Info,
  AlertCircle,
  FileText,
  Upload
} from 'lucide-react';
import '../adminPages/admin.css';

function EmployerTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({ notes: '', reason: '' });
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [proofDescription, setProofDescription] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/employer/tasks?page=1&limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTasks(data.data.tasks || []);
      } else {
        setTasks([
          { id: 1, description: 'Réparation panne électrique - Bureau principal', status: 'pending', scheduled_date: '2024-01-20', created_at: '2024-01-15T10:00:00Z', priority: 'high', reclamation: { title: 'Problème d\'électricité' } },
          { id: 2, description: 'Installation nouveau matériel réseau', status: 'in_progress', scheduled_date: '2024-01-18', created_at: '2024-01-14T14:30:00Z', priority: 'medium', reclamation: { title: 'Installation serveur' } },
          { id: 3, description: 'Maintenance préventive climatisation', status: 'completed', scheduled_date: '2024-01-10', created_at: '2024-01-05T09:15:00Z', priority: 'low', reclamation: { title: 'Maintenance annuelle' } }
        ]);
      }
    } catch (err) {
      setError('Impossible de charger les tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (task) => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`http://localhost:5000/api/employer/tasks/${task.id}/start`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccess('Tâche démarrée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        setShowActionModal(false);
        fetchTasks();
      } else {
        setError('Impossible de démarrer la tâche');
      }
    } catch (err) { setError('Erreur de connexion'); }
  };

  const handleCompleteTask = async (task) => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`http://localhost:5000/api/employer/tasks/${task.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: actionData.notes })
      });
      if (response.ok) {
        setSuccess('Tâche complétée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        setShowActionModal(false);
        setActionData({ notes: '', reason: '' });
        fetchTasks();
      } else {
        setError('Impossible de compléter la tâche');
      }
    } catch (err) { setError('Erreur de connexion'); }
  };

  const handleFailTask = async (task) => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`http://localhost:5000/api/employer/tasks/${task.id}/fail`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: actionData.reason })
      });
      if (response.ok) {
        setSuccess('Tâche marquée comme échouée');
        setTimeout(() => setSuccess(''), 3000);
        setShowActionModal(false);
        setActionData({ notes: '', reason: '' });
        fetchTasks();
      } else { setError('Impossible de signaler l\'échec'); }
    } catch (err) { setError('Erreur de connexion'); }
  };

  const handleUploadProof = async () => {
    if (proofFiles.length === 0) { setError('Veuillez sélectionner au moins un fichier'); return; }
    const formData = new FormData();
    formData.append('description', proofDescription);
    for (let file of proofFiles) { formData.append('proofs', file); }

    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`http://localhost:5000/api/employer/tasks/${selectedTask.id}/proofs`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
      });
      if (response.ok) {
        setSuccess('Preuves uploadées avec succès');
        setTimeout(() => setSuccess(''), 3000);
        setShowProofModal(false);
        setProofFiles([]);
        setProofDescription('');
        fetchTasks();
      } else { setError('Erreur lors de l\'upload'); }
    } catch (err) { setError('Erreur de connexion'); }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'En attente', class: 'rms-badge-inactive', dot: 'rms-dot-gray', icon: <Clock size={14} /> },
      in_progress: { label: 'En cours', class: 'rms-badge-active', dot: 'rms-dot-blue', icon: <Play size={14} /> },
      completed: { label: 'Terminée', class: 'rms-badge-active', dot: 'rms-dot-green', icon: <CheckCircle size={14} /> },
      failed: { label: 'Échouée', class: 'rms-badge-error', dot: 'rms-dot-red', icon: <XCircle size={14} /> }
    };
    const s = statuses[status] || statuses.pending;
    return (
      <span className={`rms-badge ${s.class}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorities = {
      high: { label: 'Haute', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      medium: { label: 'Moyenne', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      low: { label: 'Basse', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    };
    const p = priorities[priority] || priorities.medium;
    return <span style={{ fontSize: '0.75rem', fontWeight: '600', color: p.color, background: p.bg, padding: '2px 8px', borderRadius: '4px' }}>{p.label}</span>;
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR') : '—';

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <EmployerLayout><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement de vos tâches...</span></div></EmployerLayout>;

  return (
    <EmployerLayout title="Mes Tâches">
      <div className="rms-page">
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <CheckSquare size={22} color="white" />
            </div>
            <div>
              <h1>Mes Tâches</h1>
              <p>Gérez et suivez vos interventions assignées</p>
            </div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />{success}<button className="rms-alert-close" onClick={() => setSuccess('')}><X size={18} /></button></div>}

        <div className="rms-toolbar">
          <div className="rms-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une tâche..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="rms-filters">
            <Filter size={18} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="failed">Échouées</option>
            </select>
          </div>
        </div>

        <div className="rms-table-wrap">
          <table className="rms-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Priorité</th>
                <th>Échéance</th>
                <th>Réclamation</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="rms-empty">
                      <AlertCircle size={40} color="#64748b" />
                      <p>Aucune tâche trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="rms-row-hover">
                    <td style={{ fontWeight: '500', color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Info size={16} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => { setSelectedTask(task); setShowDetailModal(true); }} />
                        {task.description}
                      </div>
                    </td>
                    <td>{getPriorityBadge(task.priority)}</td>
                    <td style={{ color: '#94a3b8' }}>{formatDate(task.scheduled_date)}</td>
                    <td style={{ color: '#cbd5e1' }}>{task.reclamation?.title || '-'}</td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>
                      <div className="rms-actions">
                        {task.status === 'pending' && (
                          <button className="rms-btn-icon" onClick={() => { setSelectedTask(task); setActionType('start'); setShowActionModal(true); }} title="Démarrer">
                            <Play size={16} color="#10b981" />
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <button className="rms-btn-icon" onClick={() => { setSelectedTask(task); setActionType('complete'); setShowActionModal(true); }} title="Compléter">
                              <Check size={16} color="#10b981" />
                            </button>
                            <button className="rms-btn-icon" onClick={() => { setSelectedTask(task); setActionType('fail'); setShowActionModal(true); }} title="Échec">
                              <X size={16} color="#ef4444" />
                            </button>
                          </>
                        )}
                        <button className="rms-btn-icon" onClick={() => { setSelectedTask(task); setShowProofModal(true); }} title="Preuves">
                          <Paperclip size={16} color="#6366f1" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Détail */}
        {showDetailModal && selectedTask && (
          <div className="rms-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="rms-modal rms-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="rms-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color="#6366f1" />
                  <h2>Détail de la tâche</h2>
                </div>
                <button className="rms-modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
              </div>
              <div className="rms-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="rms-detail-group">
                    <label>Description</label>
                    <p style={{ color: '#f1f5f9', fontSize: '1rem', lineHeight: '1.6' }}>{selectedTask.description}</p>
                  </div>
                  <div className="rms-detail-group">
                    <label>Statut</label>
                    <div style={{ marginTop: '8px' }}>{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  <div className="rms-detail-group">
                    <label>Priorité</label>
                    <div style={{ marginTop: '8px' }}>{getPriorityBadge(selectedTask.priority)}</div>
                  </div>
                  <div className="rms-detail-group">
                    <label>Date planifiée</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', marginTop: '8px' }}>
                      <Calendar size={18} color="#64748b" />
                      {formatDate(selectedTask.scheduled_date)}
                    </div>
                  </div>
                  <div className="rms-detail-group">
                    <label>Date de création</label>
                    <p style={{ color: '#f1f5f9', marginTop: '8px' }}>{formatDate(selectedTask.created_at)}</p>
                  </div>
                  <div className="rms-detail-group">
                    <label>Réclamation associée</label>
                    <p style={{ color: '#f1f5f9', fontWeight: '600', marginTop: '8px' }}>{selectedTask.reclamation?.title || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => setShowDetailModal(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action */}
        {showActionModal && selectedTask && (
          <div className="rms-modal-overlay" onClick={() => setShowActionModal(false)}>
            <div className="rms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rms-modal-header">
                <h2>
                  {actionType === 'start' && 'Démarrer la tâche'}
                  {actionType === 'complete' && 'Compléter la tâche'}
                  {actionType === 'fail' && 'Signaler un échec'}
                </h2>
                <button className="rms-modal-close" onClick={() => setShowActionModal(false)}><X size={20} /></button>
              </div>
              <div className="rms-modal-body">
                <p style={{ marginBottom: '20px', color: '#94a3b8' }}>Tâche : <strong style={{ color: '#f8fafc' }}>{selectedTask.description}</strong></p>
                
                {actionType === 'complete' && (
                  <div className="rms-form-group">
                    <label>Notes de réalisation</label>
                    <textarea 
                      className="rms-input" 
                      rows="4" 
                      value={actionData.notes} 
                      onChange={(e) => setActionData({...actionData, notes: e.target.value})} 
                      placeholder="Décrivez comment s'est passée l'intervention..."
                    />
                  </div>
                )}
                
                {actionType === 'fail' && (
                  <div className="rms-form-group">
                    <label>Raison de l'échec *</label>
                    <textarea 
                      className="rms-input" 
                      rows="4" 
                      value={actionData.reason} 
                      onChange={(e) => setActionData({...actionData, reason: e.target.value})} 
                      placeholder="Expliquez pourquoi l'intervention n'a pas pu être menée à bien..."
                      required
                    />
                  </div>
                )}

                {actionType === 'start' && <p style={{ color: '#cbd5e1' }}>Voulez-vous marquer cette tâche comme "En cours" ?</p>}
              </div>
              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => setShowActionModal(false)}>Annuler</button>
                <button className="rms-btn rms-btn-primary" onClick={() => {
                  if (actionType === 'start') handleStartTask(selectedTask);
                  if (actionType === 'complete') handleCompleteTask(selectedTask);
                  if (actionType === 'fail') handleFailTask(selectedTask);
                }}>Confirmer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Preuves */}
        {showProofModal && selectedTask && (
          <div className="rms-modal-overlay" onClick={() => setShowProofModal(false)}>
            <div className="rms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rms-modal-header">
                <h2>Ajouter des preuves</h2>
                <button className="rms-modal-close" onClick={() => setShowProofModal(false)}><X size={20} /></button>
              </div>
              <div className="rms-modal-body">
                <div className="rms-form-group">
                  <label>Description des preuves</label>
                  <input 
                    className="rms-input" 
                    type="text" 
                    value={proofDescription} 
                    onChange={(e) => setProofDescription(e.target.value)} 
                    placeholder="Ex: Photos de l'équipement réparé..."
                  />
                </div>
                <div className="rms-form-group">
                  <label>Fichiers</label>
                  <div className="rms-file-upload">
                    <input 
                      type="file" 
                      multiple 
                      onChange={(e) => setProofFiles(Array.from(e.target.files))} 
                      accept="image/*,video/*"
                      id="proof-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="proof-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'}>
                      <Upload size={32} color="#10b981" />
                      <span style={{ color: '#cbd5e1', fontWeight: '500' }}>Cliquez pour uploader des fichiers</span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Images ou Vidéos acceptées</span>
                    </label>
                  </div>
                  {proofFiles.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> {proofFiles.length} fichier(s) sélectionné(s)</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => setShowProofModal(false)}>Annuler</button>
                <button className="rms-btn rms-btn-primary" onClick={handleUploadProof} disabled={proofFiles.length === 0}>Envoyer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}

export default EmployerTasks;