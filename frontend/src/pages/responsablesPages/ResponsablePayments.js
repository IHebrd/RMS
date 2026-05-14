// src/pages/responsablesPages/ResponsablePayments.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsableLayout from '../../components/ResponsableLayout';
import { CreditCard, Plus, X, AlertCircle, CheckCircle, Calendar, FileText, User, CheckSquare } from 'lucide-react';
import '../adminPages/admin.css';

function ResponsablePayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState({
    reclamation_id: '',
    distributions: [{ employer_id: '', task_id: '', amount: 0 }]
  });
  const [stats, setStats] = useState({
    total_distributed: 0,
    pending_payments: 0,
    completed_payments: 0,
    average_amount: 0
  });

  useEffect(() => {
    fetchPayments();
    fetchReclamations();
    fetchEmployees();
    fetchTasks();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/payments/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPayments(data.data.payments || []);
        calculateStats(data.data.payments || []);
      } else {
        const mockPayments = [
          { id: 1, amount: 1500, status: 'completed', date: '2024-01-15T10:00:00Z', reclamation: { title: 'Problème d\'électricité' }, employer: { first_name: 'Mohamed', last_name: 'Ben Ali' }, task: { description: 'Réparation panne électrique' } },
          { id: 2, amount: 800, status: 'completed', date: '2024-01-14T14:30:00Z', reclamation: { title: 'Installation serveur' }, employer: { first_name: 'Sarra', last_name: 'Ben Ahmed' }, task: { description: 'Installation matériel' } },
          { id: 3, amount: 2000, status: 'pending', date: '2024-01-20T09:00:00Z', reclamation: { title: 'Maintenance annuelle' }, employer: { first_name: 'Karim', last_name: 'Mezni' }, task: { description: 'Maintenance préventive' } }
        ];
        setPayments(mockPayments);
        calculateStats(mockPayments);
      }
    } catch (err) {
      setError('Impossible de charger les paiements');
    } finally {
      setLoading(false);
    }
  };

  const fetchReclamations = async () => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/reclamations', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.success) setReclamations(data.data.reclamations || []);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/employees', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.success) setEmployees(data.data.employees || []);
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.success) setTasks(data.data.tasks || []);
    } catch (err) { console.error(err); }
  };

  const calculateStats = (paymentsList) => {
    const completed = paymentsList.filter(p => p.status === 'completed');
    const pending = paymentsList.filter(p => p.status === 'pending');
    const totalAmount = completed.reduce((sum, p) => sum + p.amount, 0);
    setStats({
      total_distributed: totalAmount,
      pending_payments: pending.length,
      completed_payments: completed.length,
      average_amount: completed.length > 0 ? totalAmount / completed.length : 0
    });
  };

  const handleAddDistribution = () => setFormData({ ...formData, distributions: [...formData.distributions, { employer_id: '', task_id: '', amount: 0 }] });
  const handleRemoveDistribution = (index) => setFormData({ ...formData, distributions: formData.distributions.filter((_, i) => i !== index) });
  
  const handleDistributionChange = (index, field, value) => {
    const newDistributions = [...formData.distributions];
    newDistributions[index][field] = value;
    setFormData({ ...formData, distributions: newDistributions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.reclamation_id) { setError('Veuillez sélectionner une réclamation'); return; }
    if (formData.distributions.length === 0) { setError('Ajoutez au moins une distribution'); return; }

    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/payments/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          reclamation_org_id: parseInt(formData.reclamation_id),
          distributions: formData.distributions.map(d => ({
            employer_id: parseInt(d.employer_id),
            task_id: parseInt(d.task_id),
            amount: parseFloat(d.amount)
          }))
        })
      });
      if (response.ok) {
        setSuccess('Paiement distribué avec succès');
        setTimeout(() => { setShowModal(false); resetForm(); fetchPayments(); }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de la distribution');
      }
    } catch (err) { setError('Erreur de connexion au serveur'); }
  };

  const resetForm = () => setFormData({ reclamation_id: '', distributions: [{ employer_id: '', task_id: '', amount: 0 }] });
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getAvailableTasksForEmployee = (employeeId) => tasks.filter(task => task.employer_id === parseInt(employeeId));
  const getSelectedReclamationAmount = () => reclamations.find(r => r.id === parseInt(formData.reclamation_id))?.amount || 0;

  if (loading) return <ResponsableLayout title="Paiements"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des paiements...</span></div></ResponsableLayout>;

  return (
    <ResponsableLayout title="Gestion des Paiements">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><CreditCard size={22} /></div>
            <div>
              <h1>Gestion des Paiements</h1>
              <p>Historique et distribution des paiements</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Distribuer un paiement
          </button>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />{success}<button className="rms-alert-close" onClick={() => setSuccess('')}><X size={18} /></button></div>}

        <div className="rms-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total_distributed.toFixed(2)} <small style={{fontSize: '0.8rem', color: '#94a3b8'}}>TND</small></div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total distribué</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #0ea5e9' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.completed_payments}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Effectués</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pending_payments}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>En attente</div></div>
          <div className="rms-card" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.average_amount.toFixed(2)} <small style={{fontSize: '0.8rem', color: '#94a3b8'}}>TND</small></div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Moyenne</div></div>
        </div>

        <div className="rms-table-wrap">
          <table className="rms-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Réclamation</th>
                <th>Employé</th>
                <th>Tâche</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="rms-empty">
                      <div className="rms-empty-icon"><CreditCard size={48} /></div>
                      <h3>Aucun paiement trouvé</h3>
                      <button className="rms-btn rms-btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Distribuer un paiement</button>
                    </div>
                  </td>
                </tr>
              ) : payments.map(payment => (
                <tr key={payment.id} onClick={() => setSelectedPayment(payment)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <Calendar size={14} /> {formatDate(payment.date)}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#f1f5f9' }}>{payment.reclamation?.title || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="rms-avatar" style={{ background: '#0ea5e9', width: '24px', height: '24px', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {payment.employer?.first_name?.[0]}{payment.employer?.last_name?.[0]}
                      </div>
                      <span>{payment.employer?.first_name} {payment.employer?.last_name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{payment.task?.description?.length > 40 ? payment.task.description.substring(0, 40) + '...' : payment.task?.description || '—'}</td>
                  <td style={{ fontWeight: '700', color: '#10b981' }}>{payment.amount.toFixed(2)} TND</td>
                  <td>
                    {payment.status === 'completed' ? (
                      <span className="rms-badge rms-badge-active"><span className="rms-dot rms-dot-green"/> Payé</span>
                    ) : (
                      <span className="rms-badge rms-badge-inactive" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><span className="rms-dot" style={{ background: '#f59e0b' }}/> En attente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Détail */}
        {selectedPayment && (
          <div className="rms-modal-overlay" onClick={() => setSelectedPayment(null)}>
            <div className="rms-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Détails du paiement</h3>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => setSelectedPayment(null)}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Montant</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{selectedPayment.amount.toFixed(2)} TND</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Statut</div>
                  {selectedPayment.status === 'completed' ? (
                      <span className="rms-badge rms-badge-active"><span className="rms-dot rms-dot-green"/> Payé</span>
                    ) : (
                      <span className="rms-badge rms-badge-inactive" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><span className="rms-dot" style={{ background: '#f59e0b' }}/> En attente</span>
                    )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Calendar size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date</div>
                    <div style={{ color: '#f8fafc' }}>{formatDate(selectedPayment.date)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <FileText size={18} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Réclamation</div>
                    <div style={{ color: '#f8fafc', fontWeight: '500' }}>{selectedPayment.reclamation?.title || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <User size={18} color="#0ea5e9" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employé</div>
                    <div style={{ color: '#f8fafc' }}>{selectedPayment.employer?.first_name} {selectedPayment.employer?.last_name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckSquare size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tâche</div>
                    <div style={{ color: '#cbd5e1' }}>{selectedPayment.task?.description || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" onClick={() => setSelectedPayment(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Distribution */}
        {showModal && (
          <div className="rms-modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="rms-modal rms-modal-lg" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Distribuer un paiement</h3>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => { setShowModal(false); resetForm(); }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="rms-form-group">
                  <label>Sélectionner la réclamation <span className="req">*</span></label>
                  <select className="rms-input" value={formData.reclamation_id} onChange={e => setFormData({...formData, reclamation_id: e.target.value})} required>
                    <option value="">Choisir une réclamation</option>
                    {reclamations.map(r => <option key={r.id} value={r.id}>{r.title} — {r.amount} TND</option>)}
                  </select>
                </div>

                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1', margin: 0 }}>Distributions</label>
                    <button type="button" className="rms-btn rms-btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={handleAddDistribution}>+ Ajouter</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {formData.distributions.map((dist, index) => (
                      <div key={index} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', position: 'relative' }}>
                        {index > 0 && <button type="button" onClick={() => handleRemoveDistribution(index)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><X size={14} /></button>}
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>Distribution #{index + 1}</div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px' }}>
                          <div className="rms-form-group" style={{ margin: 0 }}>
                            <select className="rms-input" value={dist.employer_id} onChange={e => handleDistributionChange(index, 'employer_id', e.target.value)} required>
                              <option value="">Employé</option>
                              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                            </select>
                          </div>
                          <div className="rms-form-group" style={{ margin: 0 }}>
                            <select className="rms-input" value={dist.task_id} onChange={e => handleDistributionChange(index, 'task_id', e.target.value)} required disabled={!dist.employer_id}>
                              <option value="">Tâche</option>
                              {getAvailableTasksForEmployee(dist.employer_id).map(t => <option key={t.id} value={t.id}>{t.description}</option>)}
                            </select>
                          </div>
                          <div className="rms-form-group" style={{ margin: 0 }}>
                            <input className="rms-input" type="number" step="0.01" value={dist.amount} onChange={e => handleDistributionChange(index, 'amount', e.target.value)} placeholder="0.00" required />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {formData.reclamation_id ? (
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Montant de la réclamation: <strong style={{ color: '#f8fafc' }}>{getSelectedReclamationAmount()} TND</strong></span>
                    ) : <span/>}
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Total à distribuer: <strong style={{ color: '#10b981', fontSize: '1.2rem', marginLeft: '8px' }}>{formData.distributions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0).toFixed(2)} TND</strong></div>
                  </div>
                </div>

                <div className="rms-modal-actions" style={{ marginTop: '24px' }}>
                  <button type="button" className="rms-btn rms-btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
                  <button type="submit" className="rms-btn rms-btn-primary">Valider la distribution</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ResponsableLayout>
  );
}

export default ResponsablePayments;