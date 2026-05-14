// src/pages/adminPages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Building2, Users, Shield, FileText, ChevronRight, Activity } from 'lucide-react';
import './admin.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orgs: 0, responsables: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('http://localhost:5000/api/admin/organizations?limit=1', { headers: h }).then(r => r.json()),
      fetch('http://localhost:5000/api/admin/responsables?limit=1', { headers: h }).then(r => r.json()),
      fetch('http://localhost:5000/api/admin/admins?limit=1', { headers: h }).then(r => r.json()),
    ]).then(([o, r, a]) => {
      setStats({
        orgs: o.data?.pagination?.total || 0,
        responsables: r.data?.pagination?.total || 0,
        admins: a.data?.pagination?.total || 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Organisations', value: stats.orgs, icon: <Building2 size={24} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', path: '/admin/organizations' },
    { label: 'Responsables', value: stats.responsables, icon: <Users size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', path: '/admin/responsables' },
    { label: 'Administrateurs', value: stats.admins, icon: <Shield size={24} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', path: '/admin/admins' },
    { label: 'Réclamations', value: '—', icon: <FileText size={24} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', path: '/admin/reclamations' },
  ];

  const quickActions = [
    { label: 'Nouvelle organisation', icon: <Building2 size={18} />, color: '#6366f1', path: '/admin/organizations/new' },
    { label: 'Nouvel administrateur', icon: <Shield size={18} />, color: '#0ea5e9', path: '/admin/admins/new' },
    { label: 'Voir les réclamations', icon: <FileText size={18} />, color: '#f59e0b', path: '/admin/reclamations' },
    { label: 'Gérer les organisations', icon: <Building2 size={18} />, color: '#10b981', path: '/admin/organizations' },
  ];

  const Card = ({ s, i }) => (
    <div key={i} className="rms-stat-card" onClick={() => navigate(s.path)} style={{ cursor: 'pointer' }}>
      <div className="rms-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
      <div className="rms-stat-info">
        <h3 style={{ color: s.color }}>{loading ? '—' : s.value}</h3>
        <p>{s.label}</p>
      </div>
      <div style={{ marginLeft: 'auto', color: '#475569' }}><ChevronRight size={18} /></div>
    </div>
  );

  return (
    <AdminLayout title="Tableau de bord">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
            Bonjour, {adminUser.first_name || 'Administrateur'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Vue d'ensemble de la plateforme RMS.</p>
        </div>

        <div className="rms-stat-grid">
          {statCards.map((s, i) => <Card key={i} s={s} i={i} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="rms-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ color: '#6366f1' }}><Activity size={18} /></div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9' }}>Actions rapides</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickActions.map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                  cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem',
                  fontWeight: '500', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${a.color}18`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <span style={{ color: '#cbd5e1' }}>{a.label}</span>
                  <div style={{ marginLeft: 'auto', color: '#475569' }}><ChevronRight size={16} /></div>
                </button>
              ))}
            </div>
          </div>

          <div className="rms-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ color: '#10b981' }}><Activity size={18} /></div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9' }}>Navigation rapide</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Organisations', path: '/admin/organizations', color: '#6366f1' },
                { label: 'Responsables', path: '/admin/responsables', color: '#10b981' },
                { label: 'Administrateurs', path: '/admin/admins', color: '#0ea5e9' },
                { label: 'Réclamations', path: '/admin/reclamations', color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} onClick={() => navigate(item.path)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                  cursor: 'pointer', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '500',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                    {item.label}
                  </div>
                  <div style={{ color: '#475569' }}><ChevronRight size={16} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;