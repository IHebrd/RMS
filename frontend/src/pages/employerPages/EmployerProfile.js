// src/pages/employerPages/EmployerProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/EmployerLayout';
import { 
  User, 
  Mail, 
  Phone, 
  Fingerprint, 
  Award, 
  Camera, 
  Lock, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import '../adminPages/admin.css';

function EmployerProfile() {
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
    skills: [],
    avatar_url: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/employer/profile', {
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
          skills: data.data.skills || [],
          avatar_url: data.data.avatar_url || ''
        });
        if (data.data.avatar_url) {
          setAvatarPreview(data.data.avatar_url);
        }
      } else {
        setProfile({
          first_name: 'Mohamed',
          last_name: 'Sassi',
          email: 'mohamed.sassi@steg.tn',
          phone: '50123456',
          cin: '12345678',
          skills: ['Maintenance', 'Électricité', 'Plomberie'],
          avatar_url: ''
        });
      }
    } catch (err) {
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');

    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/employer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          skills: profile.skills
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Profil mis à jour avec succès');
        setTimeout(() => setSuccess(''), 3000);
        
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          await fetch('http://localhost:5000/api/employer/profile/avatar', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
          });
        }
        
        const userData = localStorage.getItem('employerUser');
        if (userData) {
          const user = JSON.parse(userData);
          user.first_name = profile.first_name;
          user.last_name = profile.last_name;
          localStorage.setItem('employerUser', JSON.stringify(user));
        }
      } else {
        setError(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) { setError('Erreur de connexion'); } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      setSaving(false); return;
    }
    
    if (passwordData.new_password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setSaving(false); return;
    }

    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
        setError(data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) { setError('Erreur de connexion'); } finally { setSaving(false); }
  };

  if (loading) return <EmployerLayout><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement du profil...</span></div></EmployerLayout>;

  return (
    <EmployerLayout title="Mon Profil">
      <div className="rms-page">
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
              <User size={22} color="white" />
            </div>
            <div>
              <h1>Mon Profil</h1>
              <p>Gérez vos informations personnelles et vos compétences</p>
            </div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />{success}<button className="rms-alert-close" onClick={() => setSuccess('')}><X size={18} /></button></div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Section de gauche: Avatar & Statut */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rms-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(14,165,233,0.2)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem', fontWeight: '800', color: '#0ea5e9' }}>
                      {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                    </span>
                  )}
                </div>
                <label style={{ position: 'absolute', bottom: '0', right: '0', background: '#0ea5e9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid #1a1a2e', transition: 'all 0.2s' }}>
                  <Camera size={18} color="white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>{profile.first_name} {profile.last_name}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>{profile.email}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>
                <CheckCircle size={14} /> Employé Vérifié
              </div>
            </div>

            <div className="rms-card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#6366f1" /> Sécurité
              </h4>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="rms-btn rms-btn-ghost" 
                style={{ width: '100%', justifyContent: 'center', gap: '10px' }}
              >
                <Lock size={16} /> Changer le mot de passe
              </button>
            </div>
          </div>

          {/* Section de droite: Formulaire */}
          <div className="rms-card" style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="rms-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    className="rms-input"
                    value={profile.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="rms-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    className="rms-input"
                    value={profile.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="rms-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} /> Email (Lecture seule)</label>
                  <input
                    type="email"
                    className="rms-input"
                    value={profile.email}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="rms-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Fingerprint size={16} /> CIN (Lecture seule)</label>
                  <input
                    type="text"
                    className="rms-input"
                    value={profile.cin}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="rms-form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} /> Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="rms-input"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="Ex: +216 50 123 456"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="#f59e0b" /> Mes Compétences
                </h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    className="rms-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Ajouter une compétence..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button type="button" className="rms-btn rms-btn-primary" onClick={handleAddSkill} style={{ padding: '0 20px', background: '#6366f1' }}>
                    <Plus size={20} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.skills.map((skill, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {profile.skills.length === 0 && <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>Aucune compétence ajoutée.</p>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="rms-btn rms-btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
                  {saving ? <div className="rms-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginRight: '8px' }}></div> : <Save size={18} style={{ marginRight: '8px' }} />}
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Password */}
        {showPasswordModal && (
          <div className="rms-modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="rms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rms-modal-header">
                <h2>Changer le mot de passe</h2>
                <button className="rms-modal-close" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="rms-modal-body">
                  <div className="rms-form-group">
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      className="rms-input"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="rms-form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="rms-input"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      required
                    />
                    <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Minimum 6 caractères</small>
                  </div>
                  <div className="rms-form-group">
                    <label>Confirmer le mot de passe</label>
                    <input
                      type="password"
                      className="rms-input"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="rms-modal-actions">
                  <button type="button" className="rms-btn rms-btn-ghost" onClick={() => setShowPasswordModal(false)}>Annuler</button>
                  <button type="submit" className="rms-btn rms-btn-primary" disabled={saving}>Changer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}

export default EmployerProfile;