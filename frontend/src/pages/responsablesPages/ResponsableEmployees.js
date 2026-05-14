// src/pages/responsablesPages/ResponsableEmployees.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsableLayout from '../../components/ResponsableLayout';
import { Users, Plus, Edit2, Power, Trash2, Search, X, AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import '../adminPages/admin.css';

function ResponsableEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit, delete
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', phone: '', cin: '', skills: []
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('responsableToken');
      const response = await fetch('http://localhost:5000/api/responsable/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmployees(data.data.employees || []);
      } else {
        setEmployees([
          { id: 1, first_name: 'Mohamed', last_name: 'Ben Ali', email: 'mohamed@test.com', phone: '50123456', cin: '12345678', skills: ['maintenance', 'electricite'], is_active: true, position: 'Technicien' },
          { id: 2, first_name: 'Sarra', last_name: 'Ben Ahmed', email: 'sarra@test.com', phone: '50234567', cin: '87654321', skills: ['plomberie'], is_active: true, position: 'Spécialiste' },
          { id: 3, first_name: 'Karim', last_name: 'Mezni', email: 'karim@test.com', phone: '50345678', cin: '13579246', skills: ['informatique', 'reseau'], is_active: false, position: 'Technicien' },
        ]);
      }
    } catch (err) {
      setError('Impossible de charger les employés');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, employee = null) => {
    setModalType(type);
    setSelectedEmployee(employee);
    setError(''); setSuccess('');

    if (type === 'add') {
      setFormData({ email: '', password: '', confirmPassword: '', first_name: '', last_name: '', phone: '', cin: '', skills: [] });
      setSkillInput('');
    } else if (type === 'edit' && employee) {
      setFormData({
        email: employee.email || '', password: '', confirmPassword: '',
        first_name: employee.first_name || '', last_name: employee.last_name || '',
        phone: employee.phone || '', cin: employee.cin || '', skills: employee.skills || []
      });
    }
    setShowModal(true);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({ ...formData, skills: formData.skills.filter(skill => skill !== skillToRemove) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (modalType === 'add') {
      if (formData.password !== formData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
      if (formData.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    }

    try {
      const token = localStorage.getItem('responsableToken');
      let url = 'http://localhost:5000/api/responsable/employees';
      let method = 'POST';
      let dataToSend = { ...formData };

      if (modalType === 'edit') {
        url = `http://localhost:5000/api/responsable/employees/${selectedEmployee.id}`;
        method = 'PUT';
        delete dataToSend.password; delete dataToSend.confirmPassword;
      } else if (modalType === 'delete') {
        url = `http://localhost:5000/api/responsable/employees/${selectedEmployee.id}`;
        method = 'DELETE';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: method !== 'DELETE' ? JSON.stringify(dataToSend) : undefined
      });

      if (response.ok) {
        setSuccess(modalType === 'delete' ? 'Employé supprimé avec succès' : `Employé ${modalType === 'add' ? 'ajouté' : 'modifié'} avec succès`);
        setTimeout(() => { setShowModal(false); fetchEmployees(); }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      const token = localStorage.getItem('responsableToken');
      const response = await fetch(`http://localhost:5000/api/responsable/employees/${employee.id}/${employee.is_active ? 'deactivate' : 'activate'}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchEmployees();
        setSuccess(`Employé ${employee.is_active ? 'désactivé' : 'activé'} avec succès`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Erreur lors du changement de statut');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cin.includes(searchTerm)
  );

  const getInitials = (f, l) => `${f?.[0]||''}${l?.[0]||''}`.toUpperCase();

  if (loading) return <ResponsableLayout title="Employés"><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement des employés...</span></div></ResponsableLayout>;

  return (
    <ResponsableLayout title="Gestion des Employés">
      <div className="rms-page" style={{ paddingTop: 0 }}>
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Users size={22} /></div>
            <div>
              <h1>Gestion des Employés</h1>
              <p>{filteredEmployees.length} employé{filteredEmployees.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="rms-btn rms-btn-primary" onClick={() => handleOpenModal('add')}>
            <UserPlus size={18} /> Ajouter un employé
          </button>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}
        {success && <div className="rms-alert rms-alert-success"><CheckCircle size={18} />{success}<button className="rms-alert-close" onClick={() => setSuccess('')}><X size={18} /></button></div>}

        <div className="rms-toolbar">
          <div className="rms-search" style={{ maxWidth: '300px' }}>
            <Search size={16} />
            <input type="text" placeholder="Rechercher par nom, email ou CIN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <span><strong style={{ color: '#f1f5f9' }}>{employees.length}</strong> Total</span>
            <span><strong style={{ color: '#10b981' }}>{employees.filter(e => e.is_active).length}</strong> Actifs</span>
            <span><strong style={{ color: '#ef4444' }}>{employees.filter(e => !e.is_active).length}</strong> Inactifs</span>
          </div>
        </div>

        <div className="rms-table-wrap">
          <table className="rms-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Email & Tél</th>
                <th>CIN</th>
                <th>Compétences</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="rms-empty">
                      <div className="rms-empty-icon"><Users size={48} /></div>
                      <h3>Aucun employé trouvé</h3>
                      <button className="rms-btn rms-btn-primary" onClick={() => handleOpenModal('add')}><Plus size={18} /> Ajouter</button>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} style={{ opacity: emp.is_active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="rms-avatar" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                        {getInitials(emp.first_name, emp.last_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{emp.first_name} {emp.last_name}</div>
                        {emp.position && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.position}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{emp.email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{emp.phone || '—'}</div>
                  </td>
                  <td><code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>{emp.cin}</code></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {emp.skills && emp.skills.map((skill, idx) => (
                        <span key={idx} style={{ background: 'rgba(14,165,233,0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{skill}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`rms-badge ${emp.is_active ? 'rms-badge-active' : 'rms-badge-inactive'}`}>
                      <span className={`rms-dot ${emp.is_active ? 'rms-dot-green' : 'rms-dot-gray'}`} />
                      {emp.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="rms-btn-icon rms-btn" title="Modifier" onClick={() => handleOpenModal('edit', emp)}><Edit2 size={16} /></button>
                      <button className="rms-btn-icon rms-btn" title={emp.is_active ? "Désactiver" : "Activer"} onClick={() => handleToggleStatus(emp)} style={{ color: emp.is_active ? '#f87171' : '#34d399' }}><Power size={16} /></button>
                      <button className="rms-btn-icon rms-btn" title="Supprimer" onClick={() => handleOpenModal('delete', emp)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="rms-modal-overlay" onClick={() => setShowModal(false)}>
            <div className={`rms-modal ${modalType !== 'delete' ? 'rms-modal-lg' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {modalType === 'add' && <><UserPlus size={20} color="#0ea5e9"/> Ajouter un employé</>}
                  {modalType === 'edit' && <><Edit2 size={20} color="#f59e0b"/> Modifier l'employé</>}
                  {modalType === 'delete' && <><Trash2 size={20} color="#ef4444"/> Supprimer l'employé</>}
                </h3>
                <button className="rms-btn rms-btn-ghost" style={{ padding: '6px' }} onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              {modalType === 'delete' ? (
                <>
                  <p style={{ marginBottom: '16px', color: '#cbd5e1' }}>Êtes-vous sûr de vouloir supprimer l'employé <strong style={{ color: 'white' }}>{selectedEmployee?.first_name} {selectedEmployee?.last_name}</strong> ?</p>
                  <p style={{ fontSize: '0.85rem', color: '#f87171', marginBottom: '24px' }}>⚠️ Cette action est irréversible.</p>
                  <div className="rms-modal-actions">
                    <button className="rms-btn rms-btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                    <button className="rms-btn rms-btn-danger" onClick={handleSubmit}>Supprimer</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="rms-form-row">
                    <div className="rms-form-group">
                      <label>Prénom <span className="req">*</span></label>
                      <input className="rms-input" type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
                    </div>
                    <div className="rms-form-group">
                      <label>Nom <span className="req">*</span></label>
                      <input className="rms-input" type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
                    </div>
                  </div>

                  <div className="rms-form-row">
                    <div className="rms-form-group">
                      <label>CIN <span className="req">*</span></label>
                      <input className="rms-input" type="text" value={formData.cin} onChange={(e) => setFormData({...formData, cin: e.target.value})} required />
                    </div>
                    <div className="rms-form-group">
                      <label>Téléphone</label>
                      <input className="rms-input" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  <div className="rms-form-group">
                    <label>Email <span className="req">*</span></label>
                    <input className="rms-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                  </div>

                  {modalType === 'add' && (
                    <div className="rms-form-row">
                      <div className="rms-form-group">
                        <label>Mot de passe <span className="req">*</span></label>
                        <input className="rms-input" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                      </div>
                      <div className="rms-form-group">
                        <label>Confirmer <span className="req">*</span></label>
                        <input className="rms-input" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                      </div>
                    </div>
                  )}

                  <div className="rms-form-group">
                    <label>Compétences</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input className="rms-input" type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Ex: maintenance, plomberie..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())} />
                      <button type="button" className="rms-btn rms-btn-ghost" onClick={handleAddSkill}>+ Ajouter</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.skills.map((skill, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {skill}
                          <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }} onClick={() => handleRemoveSkill(skill)}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rms-modal-actions">
                    <button type="button" className="rms-btn rms-btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                    <button type="submit" className="rms-btn rms-btn-primary">{modalType === 'add' ? 'Ajouter' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </ResponsableLayout>
  );
}

export default ResponsableEmployees;