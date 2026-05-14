// src/pages/userPages/UserProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cin: '',
    address: '',
    governorate: '',
    avatar_url: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const governorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Médenine',
    'Tataouine', 'Djerba'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfile({
          first_name: data.data.first_name || '',
          last_name: data.data.last_name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          cin: data.data.cin || '',
          address: data.data.address || '',
          governorate: data.data.governorate || '',
          avatar_url: data.data.avatar_url || ''
        });
        if (data.data.avatar_url) setAvatarPreview(data.data.avatar_url);
      } else {
        // Données de démonstration
        setProfile({
          first_name: 'Mohamed',
          last_name: 'Ben Ali',
          email: 'user@example.com',
          phone: '50123456',
          cin: '12345678',
          address: '123 Rue Habib Bourguiba',
          governorate: 'Tunis',
          avatar_url: ''
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address,
          governorate: profile.governorate
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Profil mis à jour avec succès');
        setTimeout(() => setSuccess(''), 3000);
        
        // Upload avatar si sélectionné
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          await fetch('http://localhost:5000/api/user/profile/avatar', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }
        
        // Mettre à jour localStorage
        const userData = localStorage.getItem('userUser');
        if (userData) {
          const user = JSON.parse(userData);
          user.first_name = profile.first_name;
          user.last_name = profile.last_name;
          localStorage.setItem('userUser', JSON.stringify(user));
        }
      } else {
        setError(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      setSaving(false);
      return;
    }
    if (passwordData.new_password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Mot de passe modifié avec succès');
        setTimeout(() => setSuccess(''), 3000);
        setShowPasswordModal(false);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setError(data.message || 'Erreur lors du changement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      {/* En-tête */}
      <div className="user-profile-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>← Retour</button>
          <h1>Mon Profil</h1>
        </div>
      </div>

      {error && <div className="user-profile-alert error">{error}<button onClick={() => setError('')}>✕</button></div>}
      {success && <div className="user-profile-alert success">{success}</div>}

      <div className="user-profile-content">
        {/* Section Avatar */}
        <div className="profile-avatar-section">
          <div className="avatar-container">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">{profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}</div>
            )}
            <label className="avatar-upload-btn">📷 Changer<input type="file" accept="image/*" onChange={handleAvatarChange} hidden /></label>
          </div>
          <div className="avatar-info">
            <h3>{profile.first_name} {profile.last_name}</h3>
            <p>{profile.email}</p>
            <span className="role-badge">Client</span>
          </div>
        </div>

        {/* Formulaire Profil */}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h2 className="section-title">Informations personnelles</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile.email} disabled className="disabled-field" />
                <small>L'email ne peut pas être modifié</small>
              </div>
              <div className="form-group">
                <label>CIN</label>
                <input type="text" value={profile.cin} disabled className="disabled-field" />
                <small>Le CIN ne peut pas être modifié</small>
              </div>
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input type="tel" name="phone" value={profile.phone} onChange={handleChange} placeholder="Votre numéro" />
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Adresse</h2>
            <div className="form-group">
              <label>Adresse</label>
              <input type="text" name="address" value={profile.address} onChange={handleChange} placeholder="Rue, numéro, code postal" />
            </div>
            <div className="form-group">
              <label>Gouvernorat</label>
              <select name="governorate" value={profile.governorate} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-password" onClick={() => setShowPasswordModal(true)}>🔒 Changer le mot de passe</button>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>

      {/* Modal Changer mot de passe */}
      {showPasswordModal && (
        <div className="user-profile-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="user-profile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Changer le mot de passe</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mot de passe actuel</label>
                  <input type="password" value={passwordData.current_password} onChange={e => setPasswordData({...passwordData, current_password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} required />
                  <small>Minimum 6 caractères</small>
                </div>
                <div className="form-group">
                  <label>Confirmer</label>
                  <input type="password" value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={saving}>Changer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;