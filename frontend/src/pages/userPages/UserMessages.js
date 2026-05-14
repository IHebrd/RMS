// src/pages/userPages/UserMessages.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UserMessages.css';

function UserMessages() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reclamation, setReclamation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [reclamations, setReclamations] = useState([]);
  const [selectedReclamationId, setSelectedReclamationId] = useState(id || '');
  const [showReclamationSelector, setShowReclamationSelector] = useState(!id);

  useEffect(() => {
    fetchReclamations();
  }, []);

  useEffect(() => {
    if (selectedReclamationId) {
      fetchReclamationDetail();
      fetchMessages();
    }
  }, [selectedReclamationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchReclamations = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/reclamations?page=1&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReclamations(data.data.reclamations || []);
        if (!selectedReclamationId && data.data.reclamations?.length > 0) {
          setSelectedReclamationId(data.data.reclamations[0].id);
          setShowReclamationSelector(false);
        }
      } else {
        // Données de démonstration
        setReclamations([
          { id: 1, title: 'Problème d\'électricité', status: 'in_progress' },
          { id: 2, title: 'Fuite d\'eau', status: 'pending' },
          { id: 3, title: 'Problème internet', status: 'resolved' }
        ]);
        if (!selectedReclamationId) {
          setSelectedReclamationId(1);
          setShowReclamationSelector(false);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les réclamations');
    } finally {
      setLoading(false);
    }
  };

  const fetchReclamationDetail = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${selectedReclamationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReclamation(data.data);
      } else {
        const mockReclamation = reclamations.find(r => r.id === parseInt(selectedReclamationId));
        setReclamation(mockReclamation || { id: selectedReclamationId, title: 'Réclamation', status: 'pending' });
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${selectedReclamationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessages(data.data.messages || []);
      } else {
        // Données de démonstration
        setMessages([
          { 
            id: 1, 
            sender: 'user', 
            message: 'Bonjour, je rencontre un problème avec mon compteur électrique depuis hier.', 
            created_at: '2024-01-15T10:00:00Z',
            read: true
          },
          { 
            id: 2, 
            sender: 'support', 
            message: 'Bonjour, nous avons bien reçu votre message. Un technicien sera assigné dans les plus brefs délais.', 
            created_at: '2024-01-15T10:30:00Z',
            read: true
          },
          { 
            id: 3, 
            sender: 'support', 
            message: 'Le technicien Ahmed Ben Ali sera chez vous demain entre 14h et 16h.', 
            created_at: '2024-01-15T14:00:00Z',
            read: false
          }
        ]);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/user/reclamations/${selectedReclamationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        setSuccess('Message envoyé');
        setTimeout(() => setSuccess(''), 2000);
        setNewMessage('');
        fetchMessages();
      } else {
        // Mode démo - ajouter le message localement
        const tempMessage = {
          id: Date.now(),
          sender: 'user',
          message: newMessage.trim(),
          created_at: new Date().toISOString(),
          read: true
        };
        setMessages([...messages, tempMessage]);
        setNewMessage('');
        setSuccess('Message envoyé (mode démo)');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'envoi du message');
      // Mode démo - ajouter le message localement
      const tempMessage = {
        id: Date.now(),
        sender: 'user',
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: true
      };
      setMessages([...messages, tempMessage]);
      setNewMessage('');
      setSuccess('Message envoyé (mode démo)');
      setTimeout(() => setSuccess(''), 2000);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'En attente', icon: '⏳', color: '#ed8936', bg: '#fffaf0' },
      in_progress: { label: 'En cours', icon: '🔄', color: '#4299e1', bg: '#ebf8ff' },
      resolved: { label: 'Résolue', icon: '✅', color: '#48bb78', bg: '#f0fff4' }
    };
    const s = statuses[status] || statuses.pending;
    return <span className="reclamation-status-badge" style={{ background: s.bg, color: s.color }}>{s.icon} {s.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getSenderName = (sender) => {
    return sender === 'user' ? 'Moi' : 'Support RMS';
  };

  const getSenderAvatar = (sender) => {
    return sender === 'user' ? '👤' : '🎧';
  };

  if (loading) {
    return (
      <div className="user-messages-loading">
        <div className="spinner"></div>
        <p>Chargement des messages...</p>
      </div>
    );
  }

  return (
    <div className="user-messages-container">
      {/* En-tête */}
      <div className="user-messages-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>← Retour</button>
          <h1>Messages</h1>
        </div>
      </div>

      {error && <div className="user-messages-alert error">{error}<button onClick={() => setError('')}>✕</button></div>}
      {success && <div className="user-messages-alert success">{success}</div>}

      <div className="messages-layout">
        {/* Sidebar - Liste des réclamations */}
        <div className="reclamations-sidebar">
          <div className="sidebar-header">
            <h3>Mes réclamations</h3>
            <button className="refresh-btn" onClick={fetchReclamations}>⟳</button>
          </div>
          <div className="reclamations-list-sidebar">
            {reclamations.length === 0 ? (
              <div className="empty-sidebar"><p>Aucune réclamation</p></div>
            ) : (
              reclamations.map(rec => (
                <div 
                  key={rec.id} 
                  className={`reclamation-sidebar-item ${selectedReclamationId === rec.id ? 'active' : ''}`}
                  onClick={() => { setSelectedReclamationId(rec.id); setShowReclamationSelector(false); }}
                >
                  <div className="sidebar-item-icon">💬</div>
                  <div className="sidebar-item-info">
                    <div className="sidebar-item-title">{rec.title}</div>
                    <div className="sidebar-item-status">{getStatusBadge(rec.status)}</div>
                  </div>
                  {!rec.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="chat-area">
          {!reclamation ? (
            <div className="chat-placeholder">
              <div className="placeholder-icon">💬</div>
              <p>Sélectionnez une réclamation pour voir les messages</p>
              {reclamations.length > 0 && (
                <button className="btn-primary" onClick={() => setShowReclamationSelector(true)}>
                  Choisir une réclamation
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <h2>{reclamation.title}</h2>
                  {getStatusBadge(reclamation.status)}
                </div>
                <div className="chat-header-meta">
                  <span>📅 {new Date(reclamation.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-messages-icon">💬</div>
                    <p>Aucun message pour l'instant</p>
                    <p className="no-messages-hint">Soyez le premier à envoyer un message</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((msg, index) => (
                      <div 
                        key={msg.id} 
                        className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}
                      >
                        <div className="message-avatar">{getSenderAvatar(msg.sender)}</div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-sender">{getSenderName(msg.sender)}</span>
                            <span className="message-time">{formatDate(msg.created_at)}</span>
                          </div>
                          <div className="message-text">{msg.message}</div>
                          {msg.read && msg.sender === 'user' && <div className="message-read">✓✓ Lu</div>}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="message-input-area">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={sending}
                />
                <button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? '...' : 'Envoyer'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modal Sélecteur de réclamation */}
      {showReclamationSelector && reclamations.length > 0 && (
        <div className="user-messages-modal-overlay" onClick={() => setShowReclamationSelector(false)}>
          <div className="user-messages-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choisir une réclamation</h2>
              <button className="modal-close" onClick={() => setShowReclamationSelector(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="reclamations-selector-list">
                {reclamations.map(rec => (
                  <div 
                    key={rec.id} 
                    className="reclamation-selector-item"
                    onClick={() => { setSelectedReclamationId(rec.id); setShowReclamationSelector(false); }}
                  >
                    <div>
                      <strong>{rec.title}</strong>
                      <div className="reclamation-selector-date">{new Date(rec.created_at).toLocaleDateString()}</div>
                    </div>
                    {getStatusBadge(rec.status)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMessages;