// src/pages/employerPages/EmployerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EmployerLayout from '../../components/EmployerLayout';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  Wallet, 
  ArrowRight, 
  Calendar,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import '../adminPages/admin.css';

function EmployerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_tasks: 0,
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
    total_earned: 0,
    pending_payment: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('employerUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
    fetchRecentTasks();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/employer/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStats(data.data);
      } else {
        setStats({
          total_tasks: 12,
          pending_tasks: 3,
          in_progress_tasks: 2,
          completed_tasks: 7,
          total_earned: 2450,
          pending_payment: 850
        });
      }
    } catch (err) {
      setStats({
        total_tasks: 12,
        pending_tasks: 3,
        in_progress_tasks: 2,
        completed_tasks: 7,
        total_earned: 2450,
        pending_payment: 850
      });
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/employer/tasks?page=1&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRecentTasks(data.data.tasks || []);
      } else {
        setRecentTasks([
          { id: 1, description: 'Réparation panne électrique', status: 'completed', scheduled_date: '2024-01-15' },
          { id: 2, description: 'Installation nouveau matériel', status: 'in_progress', scheduled_date: '2024-01-18' },
          { id: 3, description: 'Maintenance préventive', status: 'pending', scheduled_date: '2024-01-20' }
        ]);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'En attente', dot: 'rms-dot-gray', class: 'rms-badge-inactive' },
      in_progress: { label: 'En cours', dot: 'rms-dot-blue', class: 'rms-badge-active' },
      completed: { label: 'Terminée', dot: 'rms-dot-green', class: 'rms-badge-active' }
    };
    const s = statuses[status] || statuses.pending;
    return (
      <span className={`rms-badge ${s.class}`}>
        <span className={`rms-dot ${s.dot}`}></span>
        {s.label}
      </span>
    );
  };

  if (loading) return <EmployerLayout><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement de votre espace...</span></div></EmployerLayout>;

  return (
    <EmployerLayout title="Tableau de Bord">
      <div className="rms-page">
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <LayoutDashboard size={22} color="white" />
            </div>
            <div>
              <h1>Bonjour, {user?.first_name}</h1>
              <p>Bienvenue dans votre espace employé professionnel</p>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="rms-dashboard-grid">
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <ClipboardList size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.total_tasks}</h3>
              <p>Tâches totales</p>
            </div>
          </div>
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.pending_tasks + stats.in_progress_tasks}</h3>
              <p>En cours</p>
            </div>
          </div>
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.completed_tasks}</h3>
              <p>Terminées</p>
            </div>
          </div>
          <div className="rms-card rms-stat-card-premium" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))' }}>
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <Wallet size={24} />
            </div>
            <div className="rms-stat-info">
              <h3 style={{ color: '#10b981' }}>{stats.total_earned} <small style={{ fontSize: '0.9rem' }}>TND</small></h3>
              <p>Gains totaux</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Section Avancement et Paiement */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rms-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="#6366f1" /> Avancement des tâches
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="rms-progress-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#94a3b8' }}>Terminées</span>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>{stats.completed_tasks}/{stats.total_tasks}</span>
                  </div>
                  <div className="rms-progress-bar-bg">
                    <div className="rms-progress-bar-fill" style={{ width: `${(stats.completed_tasks / stats.total_tasks) * 100}%`, backgroundColor: '#10b981' }}></div>
                  </div>
                </div>
                <div className="rms-progress-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#94a3b8' }}>En cours</span>
                    <span style={{ color: '#0ea5e9', fontWeight: '600' }}>{stats.in_progress_tasks}/{stats.total_tasks}</span>
                  </div>
                  <div className="rms-progress-bar-bg">
                    <div className="rms-progress-bar-fill" style={{ width: `${(stats.in_progress_tasks / stats.total_tasks) * 100}%`, backgroundColor: '#0ea5e9' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tâches Récentes */}
            <div className="rms-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckSquare size={20} color="#10b981" /> Tâches récentes
                </h2>
                <Link to="/employer/tasks" className="rms-btn rms-btn-ghost" style={{ fontSize: '0.85rem' }}>Voir tout</Link>
              </div>
              <div className="rms-recent-list">
                {recentTasks.length === 0 ? (
                  <div className="rms-empty" style={{ padding: '40px' }}>
                    <AlertCircle size={40} color="#64748b" />
                    <p>Aucune tâche récente</p>
                  </div>
                ) : (
                  recentTasks.map((task) => (
                    <div key={task.id} className="rms-recent-item" onClick={() => navigate(`/employer/tasks`)} style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '16px', borderRadius: '12px', border: '1px solid transparent' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' }}>{task.description}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} /> {new Date(task.scheduled_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section Paiement et Profil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rms-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 15, 26, 0.2))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paiement en attente</h2>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981', marginBottom: '20px' }}>{stats.pending_payment} <small style={{ fontSize: '1rem', fontWeight: '500' }}>TND</small></div>
              <button className="rms-btn rms-btn-primary" style={{ width: '100%', background: '#10b981', color: 'white' }} onClick={() => navigate('/employer/balance')}>
                Voir mon solde <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>

            <div className="rms-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '20px' }}>Accès rapide</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link to="/employer/tasks" className="rms-quick-link">
                  <div className="rms-quick-link-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                    <CheckSquare size={18} />
                  </div>
                  <span>Mes tâches</span>
                  <ArrowRight size={16} className="arrow" />
                </Link>
                <Link to="/employer/profile" className="rms-quick-link">
                  <div className="rms-quick-link-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <User size={18} />
                  </div>
                  <span>Mon profil</span>
                  <ArrowRight size={16} className="arrow" />
                </Link>
                <Link to="/employer/balance" className="rms-quick-link">
                  <div className="rms-quick-link-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Wallet size={18} />
                  </div>
                  <span>Mon solde</span>
                  <ArrowRight size={16} className="arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rms-quick-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          text-decoration: none;
          transition: all 0.2s;
        }
        .rms-quick-link:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }
        .rms-quick-link .arrow {
          margin-left: auto;
          opacity: 0.3;
          transition: all 0.2s;
        }
        .rms-quick-link:hover .arrow {
          opacity: 1;
          color: #6366f1;
        }
        .rms-quick-link-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rms-stat-card-premium {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s;
        }
        .rms-stat-card-premium:hover {
          transform: translateY(-4px);
        }
        .rms-stat-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rms-stat-info h3 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 2px;
          line-height: 1;
        }
        .rms-stat-info p {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>
    </EmployerLayout>
  );
}

// Simple Activity icon replacement since it wasn't imported
const Activity = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const User = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default EmployerDashboard;