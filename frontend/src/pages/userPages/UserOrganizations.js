// src/pages/userPages/UserOrganizations.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserOrganizations.css';

function UserOrganizations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reclamations, setReclamations] = useState([]);
  const [newReclamation, setNewReclamation] = useState({
    title: '',
    description: '',
    type: 'general',
    urgency: 'normal'
  });
  const [showReclamationModal, setShowReclamationModal] = useState(false);

  const governorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Médenine',
    'Tataouine', 'Djerba'
  ];

  const organizationTypes = [
    { value: 'all', label: 'Tous' },
    { value: 'public', label: '🏛️ Publique' },
    { value: 'private', label: '🏢 Privée' },
    { value: 'association', label: '🤝 Association' },
    { value: 'startup', label: '🚀 Startup' }
  ];

  const reclamationTypes = [
    { value: 'electrique', label: '🔧 Électrique' },
    { value: 'plomberie', label: '💧 Plomberie' },
    { value: 'informatique', label: '💻 Informatique' },
    { value: 'general', label: '📋 Général' },
    { value: 'autre', label: '📌 Autre' }
  ];

  const urgencyLevels = [
    { value: 'low', label: '🟢 Basse' },
    { value: 'normal', label: '🔵 Normale' },
    { value: 'high', label: '🟠 Haute' },
    { value: 'urgent', label: '🔴 Urgente' }
  ];

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [searchTerm, selectedGovernorate, selectedType, organizations]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrganizations(data.data.organizations || []);
      } else {
        // Données de démonstration
        setOrganizations([
          { 
            id: 1, 
            name: 'STEG', 
            type: 'public', 
            logo: null,
            description: 'Société Tunisienne de l\'Électricité et du Gaz',
            governorate: 'Tunis',
            delegation: 'Tunis Centre',
            address: 'Rue des Énergies, Tunis',
            phone: '71123456',
            email: 'contact@steg.tn',
            website: 'www.steg.tn',
            is_active: true
          },
          { 
            id: 2, 
            name: 'SONEDE', 
            type: 'public', 
            logo: null,
            description: 'Société Nationale d\'Exploitation et de Distribution des Eaux',
            governorate: 'Ariana',
            delegation: 'Ariana Ville',
            address: 'Avenue de la Liberté, Ariana',
            phone: '71234567',
            email: 'contact@sonede.tn',
            website: 'www.sonede.tn',
            is_active: true
          },
          { 
            id: 3, 
            name: 'ORANGE Tunisie', 
            type: 'private', 
            logo: null,
            description: 'Opérateur télécommunications',
            governorate: 'Tunis',
            delegation: 'El Menzah',
            address: 'Centre Urbain Nord, Tunis',
            phone: '71123456',
            email: 'contact@orange.tn',
            website: 'www.orange.tn',
            is_active: true
          },
          { 
            id: 4, 
            name: 'Tunisie Télécom', 
            type: 'public', 
            logo: null,
            description: 'Opérateur historique des télécommunications',
            governorate: 'Tunis',
            delegation: 'Tunis Centre',
            address: 'Cité des Télécoms, Tunis',
            phone: '71234567',
            email: 'contact@tunisietelecom.tn',
            website: 'www.tunisietelecom.tn',
            is_active: true
          },
          { 
            id: 5, 
            name: 'GAT', 
            type: 'private', 
            logo: null,
            description: 'Société de transport et logistique',
            governorate: 'Sfax',
            delegation: 'Sfax Ville',
            address: 'Route de Tunis, Sfax',
            phone: '74234567',
            email: 'contact@gat.com.tn',
            website: 'www.gat.com.tn',
            is_active: true
          }
        ]);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les organisations');
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = [...organizations];
    
    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGovernorate) {
      filtered = filtered.filter(org => org.governorate === selectedGovernorate);
    }
    
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(org => org.type === selectedType);
    }
    
    setFilteredOrgs(filtered);
  };

  const fetchOrgReclamations = async (orgId) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations?organization_id=${orgId}&page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReclamations(data.data.reclamations || []);
      } else {
        setReclamations([]);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setReclamations([]);
    }
  };

  const handleCreateReclamation = async (e) => {
    e.preventDefault();
    setError('');

    if (!newReclamation.title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!newReclamation.description.trim()) {
      setError('La description est requise');
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/reclamations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newReclamation.title,
          description: newReclamation.description,
          type: newReclamation.type,
          urgency: newReclamation.urgency,
          organization_ids: [selectedOrganization.id]
        })
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        alert('Réclamation déposée avec succès');
        setShowReclamationModal(false);
        setNewReclamation({ title: '', description: '', type: 'general', urgency: 'normal' });
        fetchOrgReclamations(selectedOrganization.id);
      } else {
        setError(data.message || 'Erreur lors du dépôt');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      public: '🏛️',
      private: '🏢',
      association: '🤝',
      startup: '🚀'
    };
    return icons[type] || '🏢';
  };

  const getTypeLabel = (type) => {
    const labels = {
      public: 'Publique',
      private: 'Privée',
      association: 'Association',
      startup: 'Startup'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="user-orgs-loading">
        <div className="spinner"></div>
        <p>Chargement des organisations...</p>
      </div>
    );
  }

  return (
    <div className="user-orgs-container">
      {/* En-tête */}
      <div className="user-orgs-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>← Retour</button>
          <h1>Organisations</h1>
        </div>
      </div>

      {error && <div className="user-orgs-alert error">{error}<button onClick={() => setError('')}>✕</button></div>}

      {/* Filtres */}
      <div className="filters-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Rechercher une organisation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={selectedGovernorate} onChange={(e) => setSelectedGovernorate(e.target.value)}>
            <option value="">Tous les gouvernorats</option>
            {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {organizationTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </div>
      </div>

      {/* Statistiques */}
      <div className="orgs-stats">
        <div className="stat-card"><div className="stat-number">{organizations.length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card"><div className="stat-number">{organizations.filter(o => o.type === 'public').length}</div><div className="stat-label">Publiques</div></div>
        <div className="stat-card"><div className="stat-number">{organizations.filter(o => o.type === 'private').length}</div><div className="stat-label">Privées</div></div>
      </div>

      {/* Grille des organisations */}
      <div className="orgs-grid">
        {filteredOrgs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏢</div><p>Aucune organisation trouvée</p></div>
        ) : (
          filteredOrgs.map(org => (
            <div key={org.id} className="org-card" onClick={() => { setSelectedOrganization(org); fetchOrgReclamations(org.id); setShowDetailModal(true); }}>
              <div className="org-logo">{org.logo ? <img src={org.logo} alt={org.name} /> : <div className="org-logo-placeholder">{getTypeIcon(org.type)}</div>}</div>
              <div className="org-info">
                <div className="org-name">
                  <h3>{org.name}</h3>
                  <span className="org-type-badge" style={{ background: org.type === 'public' ? '#ebf8ff' : org.type === 'private' ? '#f0fff4' : '#faf5ff', color: org.type === 'public' ? '#4299e1' : org.type === 'private' ? '#48bb78' : '#9f7aea' }}>{getTypeLabel(org.type)}</span>
                </div>
                <p className="org-location">{org.governorate}{org.delegation && ` • ${org.delegation}`}</p>
                <div className="org-contact"><span>📞</span>{org.phone}</div>
              </div>
              <div className="org-arrow">→</div>
            </div>
          ))
        )}
      </div>

      {/* Modal Détail Organisation */}
      {showDetailModal && selectedOrganization && (
        <div className="user-orgs-modal-overlay" onClick={() => { setShowDetailModal(false); setSelectedOrganization(null); }}>
          <div className="user-orgs-modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="org-modal-title">
                <div className="org-modal-logo">{selectedOrganization.logo ? <img src={selectedOrganization.logo} alt={selectedOrganization.name} /> : <span>{getTypeIcon(selectedOrganization.type)}</span>}</div>
                <div><h2>{selectedOrganization.name}</h2><p>{getTypeLabel(selectedOrganization.type)}</p></div>
              </div>
              <button className="modal-close" onClick={() => { setShowDetailModal(false); setSelectedOrganization(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="org-detail-section">
                <h3>Description</h3>
                <p>{selectedOrganization.description || 'Aucune description disponible.'}</p>
              </div>
              <div className="org-detail-section">
                <h3>Coordonnées</h3>
                <div className="detail-grid">
                  <div><label>Adresse</label><div>{selectedOrganization.address || 'Non spécifiée'}</div></div>
                  <div><label>Gouvernorat</label><div>{selectedOrganization.governorate || 'Non spécifié'}</div></div>
                  <div><label>Téléphone</label><div>{selectedOrganization.phone || 'Non spécifié'}</div></div>
                  <div><label>Email</label><div>{selectedOrganization.email || 'Non spécifié'}</div></div>
                  <div><label>Site web</label><div>{selectedOrganization.website ? <a href={`https://${selectedOrganization.website}`} target="_blank" rel="noopener noreferrer">{selectedOrganization.website}</a> : 'Non spécifié'}</div></div>
                </div>
              </div>
              <div className="org-detail-section">
                <div className="section-header">
                  <h3>Mes réclamations</h3>
                  <button className="btn-new-reclamation" onClick={() => setShowReclamationModal(true)}>+ Nouvelle réclamation</button>
                </div>
                {reclamations.length === 0 ? (
                  <div className="empty-reclamations"><p>Aucune réclamation déposée pour cette organisation</p></div>
                ) : (
                  <div className="reclamations-list">
                    {reclamations.map(r => (
                      <div key={r.id} className="reclamation-item-mini">
                        <div><strong>{r.title}</strong><div className="reclamation-date">{new Date(r.created_at).toLocaleDateString()}</div></div>
                        <span className={`status-badge-mini ${r.status}`}>{r.status === 'pending' ? 'En attente' : r.status === 'in_progress' ? 'En cours' : 'Résolue'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setShowDetailModal(false); setSelectedOrganization(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Réclamation */}
      {showReclamationModal && selectedOrganization && (
        <div className="user-orgs-modal-overlay" onClick={() => setShowReclamationModal(false)}>
          <div className="user-orgs-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle réclamation - {selectedOrganization.name}</h2>
              <button className="modal-close" onClick={() => setShowReclamationModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateReclamation}>
              <div className="modal-body">
                <div className="form-group"><label>Titre *</label><input type="text" value={newReclamation.title} onChange={e => setNewReclamation({...newReclamation, title: e.target.value})} required /></div>
                <div className="form-group"><label>Description *</label><textarea rows="4" value={newReclamation.description} onChange={e => setNewReclamation({...newReclamation, description: e.target.value})} required /></div>
                <div className="form-row"><div className="form-group"><label>Type</label><select value={newReclamation.type} onChange={e => setNewReclamation({...newReclamation, type: e.target.value})}>{reclamationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div className="form-group"><label>Urgence</label><select value={newReclamation.urgency} onChange={e => setNewReclamation({...newReclamation, urgency: e.target.value})}>{urgencyLevels.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn-cancel" onClick={() => setShowReclamationModal(false)}>Annuler</button><button type="submit" className="btn-submit">Déposer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserOrganizations;