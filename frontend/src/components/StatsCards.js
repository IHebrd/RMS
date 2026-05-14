// src/components/StatsCards.js - Version mixte
import React, { useEffect, useState } from 'react';
import './StatsCards.css';

function StatsCards() {
  const [stats, setStats] = useState({
    total_organizations: 0,
    total_responsables: 0,
    total_admins: 0,
    total_employers: 0,
    total_reclamations: 0,
    total_tasks: 0,
    total_payments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // 1. Récupérer les réclamations depuis l'endpoint existant
      const reclaResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reclaData = await reclaResponse.json();
      console.log('Données réclamations:', reclaData);
      
      // 2. Pour les autres données, on fait des appels séparés
      const orgResponse = await fetch('http://localhost:5000/api/admin/organizations?page=1&limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orgData = await orgResponse.json();
      
      const respResponse = await fetch('http://localhost:5000/api/admin/responsables?page=1&limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const respData = await respResponse.json();
      
      const adminResponse = await fetch('http://localhost:5000/api/admin/admins?page=1&limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const adminData = await adminResponse.json();
      
      // Calculer les totaux depuis la pagination
      const totalOrganizations = orgData.data?.pagination?.total || orgData.data?.organizations?.length || 0;
      const totalResponsables = respData.data?.pagination?.total || respData.data?.responsables?.length || 0;
      const totalAdmins = adminData.data?.pagination?.total || adminData.data?.admins?.length || 0;
      
      // Pour les réclamations, on peut compter depuis le timeline
      let totalReclamations = 0;
      if (reclaData.data && reclaData.data.reclamations_timeline) {
        totalReclamations = reclaData.data.reclamations_timeline.reduce((sum, item) => sum + parseInt(item.count), 0);
      }
      
      setStats({
        total_organizations: totalOrganizations,
        total_responsables: totalResponsables,
        total_admins: totalAdmins,
        total_employers: 0, // À implémenter quand l'endpoint existe
        total_reclamations: totalReclamations,
        total_tasks: 0, // À implémenter
        total_payments: 0, // À implémenter
      });
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Organisations', value: stats.total_organizations, icon: '🏢', color: '#667eea', path: '/admin/organizations' },
    { label: 'Responsables', value: stats.total_responsables, icon: '👥', color: '#48bb78', path: '/admin/responsables' },
    { label: 'Administrateurs', value: stats.total_admins, icon: '👨‍💼', color: '#4299e1', path: '/admin/admins' },
    { label: 'Employés', value: stats.total_employers, icon: '👷', color: '#ed8936', path: '/admin/employers' },
    { label: 'Réclamations', value: stats.total_reclamations, icon: '📝', color: '#f56565', path: '/admin/reclamations' },
    { label: 'Tâches', value: stats.total_tasks, icon: '✅', color: '#38b2ac', path: '/admin/tasks' },
    { label: 'Paiements', value: stats.total_payments, icon: '💰', color: '#68d391', path: '/admin/payments' },
  ];

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {statCards.map((stat, index) => (
        <div 
          key={index} 
          className="stat-card"
          style={{ borderTopColor: stat.color }}
          onClick={() => window.location.href = stat.path}
        >
          <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
            {stat.icon}
          </div>
          <div className="stat-info">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
          <div className="stat-arrow">→</div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;