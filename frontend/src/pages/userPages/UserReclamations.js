// src/pages/userPages/UserReclamations.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UserReclamations.css';

function UserReclamations() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reclamations, setReclamations] = useState([]);
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [tracking, setTracking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'autre',
    urgency: 'normal',
    organization_ids: [],
    amount: 0,
    location_lat: null,
    location_lng: null
  });

  const [cancelData, setCancelData] = useState({ reason: '' });

  // ✅ Fixed: values now match DB enum reclamation_type
  // DB values: 'electrique', 'numerique', 'securite', 'voirie', 'plomberie', 'autre'
  const reclamationTypes = [
    { value: 'electrique', label: '🔧 Électrique' },
    { value: 'plomberie',  label: '💧 Plomberie' },
    { value: 'numerique',  label: '💻 Numérique' },
    { value: 'securite',   label: '🔒 Sécurité' },
    { value: 'voirie',     label: '🛣️ Voirie' },
    { value: 'autre',      label: '📌 Autre' }
  ];

  // ✅ Fixed: values now match DB enum urgency_level
  // DB values: 'normal', 'urgent', 'tres_urgent'
  const urgencyLevels = [
    { value: 'normal',      label: 'Normale',      color: '#4299e1' },
    { value: 'urgent',      label: 'Urgente',      color: '#ed8936' },
    { value: 'tres_urgent', label: 'Très urgente', color: '#f56565' }
  ];

  useEffect(() => {
    fetchReclamations();
    fetchOrganizations();
    if (id) {
      fetchReclamationDetail(id);
      fetchTracking(id);
      fetchMessages(id);
    }
  }, [id]);

  const fetchReclamations = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/reclamations?page=1&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReclamations(data.data.reclamations || []);
      } else {
        // Données de démonstration
        setReclamations([
          { id: 1, title: 'Problème d\'électricité', description: 'Coupure fréquente', status: 'pending',     urgency: 'urgent',      type: 'electrique', created_at: '2024-01-15T10:00:00Z' },
          { id: 2, title: 'Fuite d\'eau',            description: 'Fuite dans la salle de bain', status: 'in_progress', urgency: 'tres_urgent', type: 'plomberie',  created_at: '2024-01-14T14:30:00Z' },
          { id: 3, title: 'Problème réseau',         description: 'Connexion lente',    status: 'resolved',    urgency: 'normal',      type: 'numerique',  created_at: '2024-01-10T09:15:00Z' }
        ]);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrganizations(data.data.organizations || []);
      } else {
        setOrganizations([
          { id: 1, name: 'STEG',   type: 'public',  logo: null },
          { id: 2, name: 'SONEDE', type: 'public',  logo: null },
          { id: 3, name: 'ORANGE', type: 'private', logo: null }
        ]);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const fetchReclamationDetail = async (reclamationId) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${reclamationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedReclamation(data.data);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const fetchTracking = async (reclamationId) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${reclamationId}/tracking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTracking(data.data);
      } else {
        setTracking({
          timeline: [
            { status: 'pending', date: new Date().toISOString(), notes: 'Réclamation déposée' }
          ]
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const fetchMessages = async (reclamationId) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${reclamationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessages(data.data.messages || []);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Le titre est requis');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('La description est requise');
      setLoading(false);
      return;
    }
    if (formData.organization_ids.length === 0) {
      setError('Sélectionnez au moins une organisation');
      setLoading(false);
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
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        setSuccess('Réclamation déposée avec succès');
        setTimeout(() => {
          setShowFormModal(false);
          setFormData({
            title: '', description: '', type: 'autre', urgency: 'normal',
            organization_ids: [], amount: 0, location_lat: null, location_lng: null
          });
          fetchReclamations();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Erreur lors du dépôt');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelData.reason.trim()) {
      setError('Veuillez fournir une raison');
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${selectedReclamation?.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelData.reason })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Réclamation annulée avec succès');
        setTimeout(() => {
          setShowCancelModal(false);
          setCancelData({ reason: '' });
          fetchReclamations();
          fetchReclamationDetail(selectedReclamation?.id);
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Impossible d\'annuler');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${selectedReclamation?.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        setNewMessage('');
        fetchMessages(selectedReclamation?.id);
      } else {
        setError('Erreur lors de l\'envoi');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending:     { label: 'En attente', icon: '⏳', color: '#ed8936', bg: '#fffaf0' },
      in_progress: { label: 'En cours',   icon: '🔄', color: '#4299e1', bg: '#ebf8ff' },
      resolved:    { label: 'Résolue',    icon: '✅', color: '#48bb78', bg: '#f0fff4' },
      cancelled:   { label: 'Annulée',    icon: '❌', color: '#a0aec0', bg: '#f7fafc' }
    };
    const s = statuses[status] || statuses.pending;
    return (
      <span className={`status-badge ${status}`} style={{ background: s.bg, color: s.color }}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const u = urgencyLevels.find(l => l.value === urgency) || urgencyLevels[0];
    return (
      <span className="urgency-badge" style={{ background: `${u.color}20`, color: u.color }}>
        {u.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleOrganizationSelect = (orgId) => {
    setFormData({
      ...formData,
      organization_ids: formData.organization_ids.includes(orgId)
        ? formData.organization_ids.filter(id => id !== orgId)
        : [...formData.organization_ids, orgId]
    });
  };

  if (loading && !reclamations.length) {
    return (
      <div className="user-reclamations-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="user-reclamations-container">

      {/* En-tête */}
      <div className="user-reclamations-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>← Retour</button>
          <h1>Mes Réclamations</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowFormModal(true)}>+ Nouvelle réclamation</button>
      </div>

      {error   && <div className="alert-error">{error}<button onClick={() => setError('')}>✕</button></div>}
      {success && <div className="alert-success">{success}</div>}

      {/* Statistiques */}
      <div className="reclamations-stats">
        <div className="stat-card"><div className="stat-number">{reclamations.length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card"><div className="stat-number">{reclamations.filter(r => r.status === 'pending').length}</div><div className="stat-label">En attente</div></div>
        <div className="stat-card"><div className="stat-number">{reclamations.filter(r => r.status === 'in_progress').length}</div><div className="stat-label">En cours</div></div>
        <div className="stat-card"><div className="stat-number">{reclamations.filter(r => r.status === 'resolved').length}</div><div className="stat-label">Résolues</div></div>
      </div>

      {/* Liste des réclamations */}
      <div className="reclamations-list">
        {reclamations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Aucune réclamation</p>
            <button className="btn-primary" onClick={() => setShowFormModal(true)}>Déposer une réclamation</button>
          </div>
        ) : (
          reclamations.map(recla => (
            <div
              key={recla.id}
              className="reclamation-card"
              onClick={() => { setSelectedReclamation(recla); setShowDetailModal(true); }}
            >
              <div className="card-header">
                <div className="card-title">
                  <strong>{recla.title}</strong>
                  {getUrgencyBadge(recla.urgency)}
                </div>
                <div className="card-date">{formatDate(recla.created_at)}</div>
              </div>
              <div className="card-body">
                <p>{recla.description?.substring(0, 100)}...</p>
              </div>
              <div className="card-footer">
                <div className="card-type">
                  {reclamationTypes.find(t => t.value === recla.type)?.label || recla.type}
                </div>
                {getStatusBadge(recla.status)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal Nouvelle Réclamation ── */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle réclamation</h2>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  {/* Type — DB enum: electrique | numerique | securite | voirie | plomberie | autre */}
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      {reclamationTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Urgence — DB enum: normal | urgent | tres_urgent */}
                  <div className="form-group">
                    <label>Urgence</label>
                    <select
                      value={formData.urgency}
                      onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                    >
                      {urgencyLevels.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Organisations concernées *</label>
                  <div className="org-checkbox-list">
                    {organizations.map(org => (
                      <label key={org.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.organization_ids.includes(org.id)}
                          onChange={() => handleOrganizationSelect(org.id)}
                        />
                        <span>{org.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowFormModal(false)}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Envoi...' : 'Déposer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Détail + Messages + Tracking ── */}
      {showDetailModal && selectedReclamation && (
        <div
          className="modal-overlay"
          onClick={() => { setShowDetailModal(false); setSelectedReclamation(null); }}
        >
          <div className="modal-content-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedReclamation.title}</h2>
              <button
                className="modal-close"
                onClick={() => { setShowDetailModal(false); setSelectedReclamation(null); }}
              >✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-tabs">

                {/* Informations */}
                <div className="detail-section">
                  <h3>Informations</h3>
                  <div className="detail-grid">
                    <div><label>Statut</label>{getStatusBadge(selectedReclamation.status)}</div>
                    <div><label>Urgence</label>{getUrgencyBadge(selectedReclamation.urgency)}</div>
                    <div>
                      <label>Type</label>
                      {reclamationTypes.find(t => t.value === selectedReclamation.type)?.label || selectedReclamation.type}
                    </div>
                    <div><label>Date</label>{formatDate(selectedReclamation.created_at)}</div>
                  </div>
                  <div>
                    <label>Description</label>
                    <p className="description-text">{selectedReclamation.description}</p>
                  </div>
                </div>

                {/* Suivi */}
                <div className="detail-section">
                  <h3>Suivi</h3>
                  <div className="timeline">
                    {tracking?.timeline?.map((t, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div>
                          <strong>{getStatusBadge(t.status)}</strong>
                          <div>{formatDate(t.date)}</div>
                          {t.notes && <small>{t.notes}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="detail-section">
                  <h3>Messages</h3>
                  <div className="messages-list">
                    {messages.map(m => (
                      <div key={m.id} className={`message-item ${m.sender === 'user' ? 'user' : 'support'}`}>
                        <div className="message-sender">{m.sender === 'user' ? 'Moi' : 'Support'}</div>
                        <div className="message-text">{m.message}</div>
                        <div className="message-date">{formatDate(m.created_at)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="message-input">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Écrire un message..."
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage}>Envoyer</button>
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              {selectedReclamation.status === 'pending' && (
                <button
                  className="btn-danger"
                  onClick={() => { setShowDetailModal(false); setShowCancelModal(true); }}
                >
                  Annuler la réclamation
                </button>
              )}
              <button
                className="btn-cancel"
                onClick={() => { setShowDetailModal(false); setSelectedReclamation(null); }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Annulation ── */}
      {showCancelModal && selectedReclamation && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Annuler la réclamation</h2>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Raison de l'annulation *</label>
                <textarea
                  rows="3"
                  value={cancelData.reason}
                  onChange={e => setCancelData({ reason: e.target.value })}
                  placeholder="Expliquez pourquoi vous souhaitez annuler..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCancelModal(false)}>Retour</button>
              <button className="btn-danger" onClick={handleCancel}>Confirmer l'annulation</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserReclamations;