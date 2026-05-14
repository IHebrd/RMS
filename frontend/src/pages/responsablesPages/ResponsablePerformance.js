// src/pages/responsablesPages/ResponsablePerformance.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsableLayout from '../../components/ResponsableLayout';
import { BarChart2, Users, CheckCircle, Clock, Star, Activity, AlertCircle, X, CheckSquare, ListTodo, MoreHorizontal, Trophy, Target } from 'lucide-react';
import '../adminPages/admin.css';

function ResponsablePerformance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('month'); // week, month, year
  const [performance, setPerformance] = useState({
    team_stats: { total_employees: 0, active_employees: 0, total_tasks: 0, completed_tasks: 0, pending_tasks: 0, in_progress_tasks: 0, completion_rate: 0 },
    employee_performance: [],
    recent_activities: [],
    satisfaction_rate: 0,
    average_task_time: 0
  });

  useEffect(() => { fetchPerformance(); }, [period]);

  const fetchPerformance = async () => {
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('responsableToken');
      if (!token) { setError('Non authentifié. Veuillez vous reconnecter.'); setLoading(false); return; }

      const response = await fetch(`http://localhost:5000/api/dashboard/performance?period=${period}`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPerformance({
          team_stats: data.data?.team_stats || { total_employees: 0, active_employees: 0, total_tasks: 0, completed_tasks: 0, pending_tasks: 0, in_progress_tasks: 0, completion_rate: 0 },
          employee_performance: data.data?.employee_performance || [],
          recent_activities: data.data?.recent_activities || [],
          satisfaction_rate: data.data?.satisfaction_rate || 0,
          average_task_time: data.data?.average_task_time || 0
        });
      } else if (response.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => { localStorage.removeItem('responsableToken'); localStorage.removeItem('responsableUser'); navigate('/responsable/login'); }, 2000);
      } else {
        loadMockData();
      }
    } catch (err) {
      loadMockData();
      setError('Mode démo: Connexion au serveur impossible. Affichage des données de test.');
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setPerformance({
      team_stats: { total_employees: 8, active_employees: 7, total_tasks: 45, completed_tasks: 32, pending_tasks: 8, in_progress_tasks: 5, completion_rate: 71.1 },
      employee_performance: [
        { id: 1, first_name: 'Mohamed', last_name: 'Ben Ali', completed_tasks: 12, pending_tasks: 2, total_tasks: 14, rating: 4.8, efficiency: 92 },
        { id: 2, first_name: 'Sarra', last_name: 'Ben Ahmed', completed_tasks: 10, pending_tasks: 1, total_tasks: 11, rating: 4.9, efficiency: 95 },
        { id: 3, first_name: 'Karim', last_name: 'Mezni', completed_tasks: 6, pending_tasks: 3, total_tasks: 9, rating: 4.2, efficiency: 78 },
        { id: 4, first_name: 'Nour', last_name: 'Jabri', completed_tasks: 4, pending_tasks: 2, total_tasks: 6, rating: 4.0, efficiency: 70 },
        { id: 5, first_name: 'Ahmed', last_name: 'Souissi', completed_tasks: 0, pending_tasks: 0, total_tasks: 0, rating: 0, efficiency: 0 }
      ],
      recent_activities: [
        { id: 1, action: 'Tâche complétée', employee: 'Mohamed Ben Ali', task: 'Réparation panne électrique', date: new Date().toISOString() },
        { id: 2, action: 'Nouvelle tâche assignée', employee: 'Sarra Ben Ahmed', task: 'Installation serveur', date: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, action: 'Tâche validée', employee: 'Karim Mezni', task: 'Maintenance préventive', date: new Date(Date.now() - 172800000).toISOString() }
      ],
      satisfaction_rate: 88.5,
      average_task_time: 3.2
    });
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return '#10b981';
    if (efficiency >= 70) return '#0ea5e9';
    if (efficiency >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getRatingStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < Math.floor(rating) ? '#f59e0b' : 'transparent'} strokeWidth={i < Math.floor(rating) ? 0 : 1} stroke={i < Math.floor(rating) ? 'none' : '#64748b'} />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Date invalide'; }
  };

  const getActivityIcon = (action) => {
    if (action === 'Tâche complétée') return <CheckCircle size={16} color="#10b981" />;
    if (action === 'Nouvelle tâche assignée') return <ListTodo size={16} color="#0ea5e9" />;
    if (action === 'Tâche validée') return <CheckSquare size={16} color="#8b5cf6" />;
    return <MoreHorizontal size={16} color="#64748b" />;
  };

  const teamStats = performance?.team_stats || {};
  const employeeList = performance?.employee_performance || [];
  const activities = performance?.recent_activities || [];
  const satisfactionRate = performance?.satisfaction_rate || 0;
  const averageTaskTime = performance?.average_task_time || 0;

  if (loading) return <ResponsableLayout title="Performance"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des performances...</span></div></ResponsableLayout>;

  return (
    <ResponsableLayout title="Performance de l'équipe">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}><BarChart2 size={22} /></div>
            <div>
              <h1>Performance de l'équipe</h1>
              <p>Analyses et statistiques détaillées</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '4px' }}>
            {['week', 'month', 'year'].map(p => (
              <button key={p} className="rms-btn rms-btn-ghost" style={{ padding: '6px 16px', borderRadius: '6px', background: period === p ? 'rgba(255,255,255,0.1)' : 'transparent', color: period === p ? 'white' : '#94a3b8' }} onClick={() => setPeriod(p)}>
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}

        <div className="rms-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="rms-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', padding: '12px', borderRadius: '12px' }}><Activity size={24} /></div>
            <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{teamStats.completion_rate || 0}%</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Taux de complétion</div></div>
          </div>
          <div className="rms-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px', borderRadius: '12px' }}><CheckCircle size={24} /></div>
            <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{teamStats.completed_tasks || 0}</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tâches complétées</div></div>
          </div>
          <div className="rms-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '12px', borderRadius: '12px' }}><Clock size={24} /></div>
            <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{averageTaskTime || 0} <small style={{fontSize: '0.9rem', fontWeight: '500'}}>j</small></div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Temps moyen</div></div>
          </div>
          <div className="rms-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '12px', borderRadius: '12px' }}><Star size={24} /></div>
            <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{satisfactionRate || 0}%</div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Satisfaction client</div></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="rms-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}><Users size={20} color="#0ea5e9"/> Effectif</div>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f8fafc', lineHeight: 1 }}>{teamStats.total_employees || 0}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Total employés</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', lineHeight: 1 }}>{teamStats.active_employees || 0}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Actifs</div>
              </div>
            </div>
          </div>
          <div className="rms-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}><Target size={20} color="#10b981"/> État des tâches</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}><span style={{ color: '#cbd5e1' }}>✅ Complétées ({teamStats.completed_tasks})</span><span style={{ color: '#10b981' }}>{teamStats.total_tasks ? Math.round((teamStats.completed_tasks / teamStats.total_tasks) * 100) : 0}%</span></div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${teamStats.total_tasks ? (teamStats.completed_tasks / teamStats.total_tasks) * 100 : 0}%`, height: '100%', background: '#10b981' }}/></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}><span style={{ color: '#cbd5e1' }}>🔄 En cours ({teamStats.in_progress_tasks})</span><span style={{ color: '#0ea5e9' }}>{teamStats.total_tasks ? Math.round((teamStats.in_progress_tasks / teamStats.total_tasks) * 100) : 0}%</span></div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${teamStats.total_tasks ? (teamStats.in_progress_tasks / teamStats.total_tasks) * 100 : 0}%`, height: '100%', background: '#0ea5e9' }}/></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}><span style={{ color: '#cbd5e1' }}>⏳ En attente ({teamStats.pending_tasks})</span><span style={{ color: '#f59e0b' }}>{teamStats.total_tasks ? Math.round((teamStats.pending_tasks / teamStats.total_tasks) * 100) : 0}%</span></div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${teamStats.total_tasks ? (teamStats.pending_tasks / teamStats.total_tasks) * 100 : 0}%`, height: '100%', background: '#f59e0b' }}/></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="rms-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={20} color="#f59e0b" /> Performance des employés</h2>
            <div className="rms-table-wrap" style={{ margin: 0, boxShadow: 'none' }}>
              <table className="rms-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Tâches</th>
                    <th>Complétées</th>
                    <th>Efficacité</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeList.map(emp => (
                    <tr key={emp.id} style={{ opacity: emp.completed_tasks === 0 ? 0.6 : 1 }}>
                      <td style={{ fontWeight: '600', color: '#f8fafc' }}>{emp.first_name} {emp.last_name}</td>
                      <td>{emp.total_tasks || 0}</td>
                      <td>{emp.completed_tasks || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${emp.efficiency || 0}%`, height: '100%', background: getEfficiencyColor(emp.efficiency || 0) }}/>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{emp.efficiency || 0}%</span>
                        </div>
                      </td>
                      <td>
                        {emp.rating > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getRatingStars(emp.rating)}
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc' }}>{emp.rating}</span>
                          </div>
                        ) : <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Non évalué</span>}
                      </td>
                    </tr>
                  ))}
                  {employeeList.length === 0 && <tr><td colSpan="5"><div className="rms-empty">Aucun employé</div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rms-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><ListTodo size={20} color="#0ea5e9" /> Activités récentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>Aucune activité</p> : 
                activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getActivityIcon(act.action)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '500', marginBottom: '2px' }}>{act.action || 'Action'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}><strong style={{ color: '#cbd5e1' }}>{act.employee}</strong> - {act.task}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{formatDate(act.date)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

      </div>
    </ResponsableLayout>
  );
}

export default ResponsablePerformance;