// src/pages/userPages/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  Building2, 
  User, 
  AlertCircle,
  Calendar,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import '../adminPages/admin.css';

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_reclamations: 0,
    pending_reclamations: 0,
    in_progress_reclamations: 0,
    resolved_reclamations: 0,
    recent_reclamations: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('userUser');
    if (userData) setUser(JSON.parse(userData));
    fetchReclamations();
  }, []);

  const fetchReclamations = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/reclamations?page=1&limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const reclamations = data.data.reclamations || [];
        setStats({
          total_reclamations: reclamations.length,
          pending_reclamations: reclamations.filter(r => r.status === 'pending').length,
          in_progress_reclamations: reclamations.filter(r => r.status === 'in_progress').length,
          resolved_reclamations: reclamations.filter(r => r.status === 'resolved' || r.status === 'completed').length,
          recent_reclamations: reclamations.slice(0, 5)
        });
      } else {
        // Mock data if API fails
        setStats({
          total_reclamations: 8,
          pending_reclamations: 3,
          in_progress_reclamations: 2,
          resolved_reclamations: 3,
          recent_reclamations: [
            { id: 1, title: 'Panne électrique Escalier A', status: 'pending', created_at: new Date().toISOString() },
            { id: 2, title: 'Fuite d\'eau Toit', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: 3, title: 'Ascenseur en panne', status: 'resolved', created_at: new Date(Date.now() - 172800000).toISOString() }
          ]
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { path: '/user/reclamations/new', icon: <PlusCircle size={22} />, title: 'Nouvelle réclamation', desc: 'Déposer une nouvelle demande', color: '#6366f1' },
    { path: '/user/reclamations', icon: <FileText size={22} />, title: 'Mes réclamations', desc: 'Suivre l\'état de mes demandes', color: '#10b981' },
    { path: '/user/organizations', icon: <Building2 size={22} />, title: 'Organisations', desc: 'Découvrir nos partenaires', color: '#f59e0b' },
    { path: '/user/messages/all', icon: <MessageSquare size={22} />, title: 'Mes Messages', desc: 'Discuter avec les responsables', color: '#8b5cf6' }
  ];

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'En attente', dot: 'rms-dot-gray', class: 'rms-badge-inactive' },
      in_progress: { label: 'En cours', dot: 'rms-dot-blue', class: 'rms-badge-active' },
      resolved: { label: 'Traité', dot: 'rms-dot-green', class: 'rms-badge-active' },
      completed: { label: 'Terminé', dot: 'rms-dot-green', class: 'rms-badge-active' }
    };
    const s = statuses[status] || statuses.pending;
    return (
      <span className={`rms-badge ${s.class}`}>
        <span className={`rms-dot ${s.dot}`}></span>
        {s.label}
      </span>
    );
  };

  if (loading) return <UserLayout><div className="rms-loader"><div className="rms-spinner"></div><span>Initialisation de votre espace...</span></div></UserLayout>;

  return (
    <UserLayout title="Tableau de Bord Client">
      <div className="rms-page">
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <LayoutDashboard size={22} color="white" />
            </div>
            <div>
              <h1>Bonjour, {user?.first_name}</h1>
              <p>Bienvenue dans votre portail de réclamations RMS</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => navigate('/user/reclamations/new')}>
            <PlusCircle size={18} style={{ marginRight: '8px' }} /> Déposer une réclamation
          </button>
        </div>

        {/* Statistiques Rapides */}
        <div className="rms-dashboard-grid" style={{ marginBottom: '32px' }}>
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <FileText size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.total_reclamations}</h3>
              <p>Total déposées</p>
            </div>
          </div>
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.pending_reclamations}</h3>
              <p>En attente</p>
            </div>
          </div>
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.in_progress_reclamations}</h3>
              <p>En cours</p>
            </div>
          </div>
          <div className="rms-card rms-stat-card-premium">
            <div className="rms-stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{stats.resolved_reclamations}</h3>
              <p>Résolues</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Section Réclamations Récentes */}
          <div className="rms-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#6366f1" /> Dernières réclamations
              </h2>
              <Link to="/user/reclamations" className="rms-btn rms-btn-ghost" style={{ fontSize: '0.85rem' }}>Voir tout</Link>
            </div>

            <div className="rms-table-wrap" style={{ boxShadow: 'none', border: '1px solid rgba(255,255,255,0.05)', margin: 0 }}>
              <table className="rms-table">
                <thead>
                  <tr>
                    <th>Sujet</th>
                    <th>Date de dépôt</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_reclamations.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="rms-empty">
                          <AlertCircle size={40} color="#64748b" />
                          <p>Aucune réclamation récente</p>
                          <Link to="/user/reclamations/new" className="rms-btn rms-btn-primary" style={{ marginTop: '16px' }}>Déposer maintenant</Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    stats.recent_reclamations.map((r) => (
                      <tr key={r.id} className="rms-row-hover" onClick={() => navigate(`/user/reclamations/${r.id}`)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: '600', color: '#f1f5f9' }}>{r.title}</td>
                        <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} /> {new Date(r.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td>{getStatusBadge(r.status)}</td>
                        <td><ChevronRight size={18} color="#64748b" /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Accès Rapide & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rms-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '20px' }}>Accès rapide</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {menuItems.map((item) => (
                  <Link to={item.path} key={item.path} className="rms-quick-link">
                    <div className="rms-quick-link-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#e2e8f0' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                    </div>
                    <ArrowRight size={16} className="arrow" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rms-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(15, 15, 26, 0.4))' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#6366f1" /> Mon Compte
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>
                  {user?.first_name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{user?.first_name} {user?.last_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.email}</div>
                </div>
              </div>
              <button className="rms-btn rms-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/user/profile')}>
                Modifier mon profil
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rms-quick-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rms-quick-link:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }
        .rms-quick-link .arrow {
          margin-left: auto;
          opacity: 0.2;
          transition: all 0.3s;
        }
        .rms-quick-link:hover .arrow {
          opacity: 1;
          transform: translateX(4px);
        }
        .rms-quick-link-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rms-stat-card-premium {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.3s;
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
    </UserLayout>
  );
}

export default UserDashboard;