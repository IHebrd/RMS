// src/pages/responsablesPages/ResponsableTasks.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsableLayout from '../../components/ResponsableLayout';
import { CheckSquare, Plus, Search, Edit2, CheckCircle, X, AlertCircle, Calendar, User, FileText } from 'lucide-react';
import '../adminPages/admin.css';

function ResponsableTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [formData, setFormData] = useState({
    reclamation_org_id: '',
    employer_ids: [],
    description: '',
    scheduled_date: '',
    payment_amounts: []
  });
  const [validationData, setValidationData] = useState({
    status: '',
    comment: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchReclamations();
  }, []);

  const extractErrorMessage = (data) => data?.error?.message || data?.message || 'Une erreur est survenue';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTasks(data.data.tasks || []);
      } else {
        setTasks([
          { id: 1, description: 'Réparation panne électrique', status: 'pending', priority: 'high', scheduled_date: '2024-01-20', created_at: '2024-01-15T10:00:00Z', employer: { first_name: 'Mohamed', last_name: 'Ben Ali' }, reclamation: { title: "Problème d'électricité" } },
          { id: 2, description: 'Installation nouveau matériel', status: 'in_progress', priority: 'medium', scheduled_date: '2024-01-18', created_at: '2024-01-14T14:30:00Z', employer: { first_name: 'Sarra', last_name: 'Ben Ahmed' }, reclamation: { title: 'Installation serveur' } },
          { id: 3, description: 'Maintenance préventive', status: 'completed', priority: 'low', scheduled_date: '2024-01-10', created_at: '2024-01-05T09:15:00Z', employer: { first_name: 'Karim', last_name: 'Mezni' }, reclamation: { title: 'Maintenance annuelle' } },
        ]);
      }
    } catch (err) {
      setError('Impossible de charger les tâches');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmployees(data.data.employees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReclamations = async () => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/reclamations?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReclamations(data.data.reclamations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (modalType === 'add' && !formData.reclamation_org_id) { setError('Veuillez sélectionner une réclamation'); return; }
    if (!formData.description || !formData.scheduled_date) { setError('Veuillez remplir tous les champs obligatoires'); return; }

    try {
      const token = localStorage.getItem('responsableToken');
      let url = 'http://localhost:5000/api/responsable/tasks';
      let method = 'POST';
      let dataToSend;

      if (modalType === 'add') {
        dataToSend = {
          reclamation_org_id: Number(formData.reclamation_org_id),
          employer_ids: formData.employer_ids,
          description: formData.description,
          scheduled_date: formData.scheduled_date,
          payment_amounts: formData.employer_ids.map(() => 0)
        };
      } else {
        url = `http://localhost:5000/api/responsable/tasks/${selectedTask.id}`;
        method = 'PUT';
        dataToSend = {
          description: formData.description,
          scheduled_date: formData.scheduled_date,
          employer_id: formData.employer_ids.length > 0 ? formData.employer_ids[0] : undefined
        };
      }

      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(dataToSend)
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(`Tâche ${modalType === 'add' ? 'créée' : 'modifiée'} avec succès`);
        setTimeout(() => { setShowModal(false); fetchTasks(); resetForm(); }, 1500);
      } else {
        setError(extractErrorMessage(data));
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const handleValidateTask = async (taskId) => {
    if (!validationData.status) { setError('Veuillez sélectionner un statut'); return; }
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch(`http://localhost:5000/api/responsable/tasks/${taskId}/validate`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: validationData.status, comment: validationData.comment })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Tâche validée avec succès');
        setTimeout(() => { setShowValidateModal(false); setSelectedTask(null); setValidationData({ status: '', comment: '' }); fetchTasks(); }, 1500);
      } else {
        setError(extractErrorMessage(data));
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const openEditModal = (task) => {
    setModalType('edit');
    setSelectedTask(task);
    setFormData({
      reclamation_org_id: task.reclamation_org_id || '',
      employer_ids: task.employer_id ? [task.employer_id] : [],
      description: task.description,
      scheduled_date: task.scheduled_date?.split('T')[0] || task.scheduled_date || '',
      payment_amounts: []
    });
    setShowModal(true);
  };

  const handleEmployeeSelection = (employeeId) => {
    if (formData.employer_ids.includes(employeeId)) {
      setFormData({ ...formData, employer_ids: formData.employer_ids.filter(id => id !== employeeId) });
    } else {
      setFormData({ ...formData, employer_ids: [...formData.employer_ids, employeeId] });
    }
  };

  const resetForm = () => {
    setFormData({ reclamation_org_id: '', employer_ids: [], description: '', scheduled_date: '', payment_amounts: [] });
    setValidationData({ status: '', comment: '' });
    setSelectedTask(null);
  };

  const openValidateModal = (task) => {
    setSelectedTask(task);
    setValidationData({ status: '', comment: '' });
    setShowValidateModal(true);
  };

  const getStatusBadge = (status) => {
    const s = {
      pending: { label: 'En attente', class: 'rms-badge-inactive', dot: 'rms-dot-gray' },
      assigned: { label: 'Assignée', class: 'rms-badge-active', dot: 'rms-dot-blue', overrideBg: 'rgba(139,92,246,0.1)', overrideColor: '#8b5cf6' },
      in_progress: { label: 'En cours', class: 'rms-badge-active', dot: 'rms-dot-blue' },
      completed: { label: 'Terminée', class: 'rms-badge-active', dot: 'rms-dot-green' },
      failed: { label: 'Échouée', class: 'rms-badge-error', dot: 'rms-dot-red', overrideBg: 'rgba(239,68,68,0.1)', overrideColor: '#ef4444' }
    }[status] || { label: 'En attente', class: 'rms-badge-inactive', dot: 'rms-dot-gray' };
    return <span className={`rms-badge ${s.class}`} style={s.overrideColor ? { color: s.overrideColor, background: s.overrideBg } : {}}><span className={`rms-dot ${s.dot}`} /> {s.label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const p = {
      low: { label: 'Basse', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
      medium: { label: 'Moyenne', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      high: { label: 'Haute', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    }[priority] || { label: 'Moyenne', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', background: p.bg, color: p.color }}>{p.label}</span>;
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  if (loading) return <ResponsableLayout title="Tâches"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des tâches...</span></div></ResponsableLayout>;

  return (
    <ResponsableLayout title="Gestion des Tâches">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><CheckSquare size={22} /></div>
            <div>
              <h1>Gestion des Tâches</h1>
              <p>Planifiez et suivez les interventions</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => { setModalType('add'); resetForm(); setShowModal(true); }}>
            <Plus size={18} /> Créer une tâche
          </button>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />{success}<button className="rms-alert-close" onClick={() => setSuccess('')}><X size={18} /></button></div>}

        <div className="rms-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #64748b' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pending}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>En attente</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #0ea5e9' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.in_progress}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>En cours</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.completed}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Terminées</div></div>
        </div>

        <div className="rms-toolbar">
          <div className="rms-search" style={{ maxWidth: '300px' }}>
            <Search size={16} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="rms-filters" style={{ display: 'flex', gap: '8px' }}>
            {[{ key: 'all', label: 'Toutes' }, { key: 'pending', label: 'En attente' }, { key: 'in_progress', label: 'En cours' }, { key: 'completed', label: 'Terminées' }].map(s => (
              <button key={s.key} className={`rms-btn rms-btn-ghost ${filterStatus === s.key ? 'active' : ''}`} onClick={() => setFilterStatus(s.key)} style={filterStatus === s.key ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}>{s.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTasks.length === 0 ? (
            <div className="rms-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="rms-empty-icon"><CheckSquare size={48} /></div>
              <h3>Aucune tâche trouvée</h3>
              <button className="rms-btn rms-btn-primary" onClick={() => { setModalType('add'); resetForm(); setShowModal(true); }}><Plus size={18} /> Créer une tâche</button>
            </div>
          ) : filteredTasks.map(task => (
            <div key={task.id} className="rms-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.4' }}>{task.description}</h3>
                {task.priority && getPriorityBadge(task.priority)}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
                <Calendar size={14} /> Prévue pour le {formatDate(task.scheduled_date)}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <User size={14} color="#0ea5e9" />
                  <span style={{ color: '#cbd5e1' }}>Employé:</span>
                  <strong style={{ color: '#f8fafc' }}>{task.first_name || task.employer?.first_name || '—'} {task.last_name || task.employer?.last_name || ''}</strong>
                </div>
                {(task.title || task.reference || task.reclamation?.title) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <FileText size={14} color="#f59e0b" />
                    <span style={{ color: '#cbd5e1' }}>Réf:</span>
                    <strong style={{ color: '#f8fafc' }}>{task.reference || task.title || task.reclamation?.title}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {getStatusBadge(task.status)}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="rms-btn rms-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEditModal(task)}><Edit2 size={14} /> Modifier</button>
                  {task.status !== 'completed' && task.status !== 'failed' && (
                    <button className="rms-btn rms-btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openValidateModal(task)}><CheckCircle size={14} /> Valider</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="rms-modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>{modalType === 'add' ? 'Créer une tâche' : 'Modifier la tâche'}</h3>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => { setShowModal(false); resetForm(); }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit}>
                {modalType === 'add' && (
                  <div className="rms-form-group">
                    <label>Réclamation <span className="req">*</span></label>
                    {reclamations.length > 0 ? (
                      <select className="rms-input" value={formData.reclamation_org_id} onChange={(e) => setFormData({ ...formData, reclamation_org_id: e.target.value })} required>
                        <option value="">— Sélectionner une réclamation —</option>
                        {reclamations.map(rec => (
                          <option key={rec.id} value={rec.id}>{rec.reference ? `${rec.reference} — ` : `#${rec.id} — `}{rec.title || 'Sans titre'} {rec.status ? `(${rec.status})` : ''}</option>
                        ))}
                      </select>
                    ) : <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ Aucune réclamation disponible.</p>}
                  </div>
                )}

                <div className="rms-form-group">
                  <label>Description <span className="req">*</span></label>
                  <textarea className="rms-input" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Décrivez la tâche..." required />
                </div>

                <div className="rms-form-group">
                  <label>Date prévue <span className="req">*</span></label>
                  <input className="rms-input" type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} required />
                </div>

                <div className="rms-form-group">
                  <label>{modalType === 'add' ? 'Assigner à des employés' : 'Employé assigné'}</label>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                    {employees.length === 0 && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Aucun employé disponible</span>}
                    {employees.map(emp => (
                      <label key={emp.id} className="rms-toggle-label" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type={modalType === 'add' ? 'checkbox' : 'radio'} style={{ width: '16px', height: '16px', accentColor: '#10b981' }} checked={formData.employer_ids.includes(emp.id)} onChange={() => {
                          if (modalType === 'edit') setFormData({ ...formData, employer_ids: [emp.id] });
                          else handleEmployeeSelection(emp.id);
                        }} />
                        <span style={{ color: '#e2e8f0' }}>{emp.first_name} {emp.last_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rms-modal-actions">
                  <button type="button" className="rms-btn rms-btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
                  <button type="submit" className="rms-btn rms-btn-primary">{modalType === 'add' ? 'Créer' : 'Enregistrer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Validation */}
        {showValidateModal && selectedTask && (
          <div className="rms-modal-overlay" onClick={() => { setShowValidateModal(false); setSelectedTask(null); setValidationData({ status: '', comment: '' }); }}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Valider la tâche</h3>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => { setShowValidateModal(false); setSelectedTask(null); setValidationData({ status: '', comment: '' }); }}><X size={20} /></button>
              </div>

              <div className="rms-form-group">
                <label>Tâche</label>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>{selectedTask.description}</div>
              </div>

              <div className="rms-form-group">
                <label>Statut <span className="req">*</span></label>
                <select className="rms-input" value={validationData.status} onChange={(e) => setValidationData({ ...validationData, status: e.target.value })}>
                  <option value="">Sélectionner un statut final</option>
                  <option value="completed">Terminée</option>
                  <option value="failed">Échouée</option>
                </select>
              </div>

              <div className="rms-form-group">
                <label>Commentaire</label>
                <textarea className="rms-input" rows="3" value={validationData.comment} onChange={(e) => setValidationData({ ...validationData, comment: e.target.value })} placeholder="Ajoutez un commentaire..." />
              </div>

              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => { setShowValidateModal(false); setSelectedTask(null); setValidationData({ status: '', comment: '' }); }}>Annuler</button>
                <button className="rms-btn rms-btn-primary" onClick={() => handleValidateTask(selectedTask.id)}>Valider</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsableLayout>
  );
}

export default ResponsableTasks;