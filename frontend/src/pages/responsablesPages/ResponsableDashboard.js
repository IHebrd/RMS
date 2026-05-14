// src/pages/responsablesPages/ResponsableDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsableLayout from '../../components/ResponsableLayout';
import { FileText, Users, CheckSquare, CreditCard, BarChart2, TrendingUp, TrendingDown, ClipboardList, Activity } from 'lucide-react';
import '../adminPages/admin.css';

function ResponsableDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_reclamations: 0,
    total_employees: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    satisfaction_rate: 0
  });

  useEffect(() => {
    const userData = localStorage.getItem('responsableUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStats(data.data);
      } else {
        setStats({
          total_reclamations: 12,
          total_employees: 8,
          total_tasks: 24,
          completed_tasks: 18,
          pending_tasks: 6,
          satisfaction_rate: 92
        });
      }
    } catch (err) {
      setStats({
        total_reclamations: 12,
        total_employees: 8,
        total_tasks: 24,
        completed_tasks: 18,
        pending_tasks: 6,
        satisfaction_rate: 92
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Réclamations', value: stats.total_reclamations, icon: <FileText size={24} />, color: 'linear-gradient(135deg, #ef4444, #dc2626)', trend: '+12%' },
    { title: 'Employés', value: stats.total_employees, icon: <Users size={24} />, color: 'linear-gradient(135deg, #0ea5e9, #0284c7)', trend: '+3' },
    { title: 'Tâches totales', value: stats.total_tasks, icon: <ClipboardList size={24} />, color: 'linear-gradient(135deg, #10b981, #059669)', trend: '+8' },
    { title: 'Tâches complétées', value: stats.completed_tasks, icon: <CheckSquare size={24} />, color: 'linear-gradient(135deg, #f59e0b, #d97706)', trend: `${stats.total_tasks ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%` },
  ];

  const quickActions = [
    { title: 'Réclamations', desc: 'Gérer les réclamations', icon: <FileText size={20} />, path: '/responsable/reclamations', bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    { title: 'Employés', desc: 'Gérer votre équipe', icon: <Users size={20} />, path: '/responsable/employees', bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9' },
    { title: 'Tâches', desc: 'Suivi des tâches', icon: <CheckSquare size={20} />, path: '/responsable/tasks', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    { title: 'Paiements', desc: 'Historique des paiements', icon: <CreditCard size={20} />, path: '/responsable/payments', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    { title: 'Performance', desc: 'Statistiques équipe', icon: <BarChart2 size={20} />, path: '/responsable/performance', bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <ResponsableLayout title="Tableau de bord">
        <div className="rms-loader">
          <div className="rms-spinner"></div>
          <span>Chargement du tableau de bord...</span>
        </div>
      </ResponsableLayout>
    );
  }

  const completionRate = stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks) * 100 : 0;

  return (
    <ResponsableLayout title="Tableau de bord">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Activity size={22} />
            </div>
            <div>
              <h1>Tableau de bord</h1>
              <p>Bienvenue, {user?.first_name || 'Responsable'} {user?.last_name || ''}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="rms-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {statCards.map((card, idx) => (
            <div key={idx} className="rms-stat-card rms-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="rms-stat-icon" style={{ background: card.color, width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500', marginBottom: '4px' }}>{card.title}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc', lineHeight: '1' }}>{card.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '0.8rem', color: '#34d399', fontWeight: '500' }}>
                  <TrendingUp size={14} /> {card.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="rms-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Tâches en cours</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', marginBottom: '16px' }}>{stats.pending_tasks}</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
            </div>
          </div>
          <div className="rms-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Taux de satisfaction</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', marginBottom: '16px' }}>{stats.satisfaction_rate}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.satisfaction_rate}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '20px' }}>Accès rapide</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {quickActions.map((action, idx) => (
            <div key={idx} className="rms-card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s' }} onClick={() => navigate(action.path)} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <div style={{ background: action.bg, color: action.color, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                {action.icon}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' }}>{action.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{action.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </ResponsableLayout>
  );
}

export default ResponsableDashboard;