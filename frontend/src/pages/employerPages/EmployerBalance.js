// src/pages/employerPages/EmployerBalance.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/EmployerLayout';
import { 
  CreditCard, 
  Wallet, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  ChevronRight, 
  Info, 
  AlertCircle, 
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search
} from 'lucide-react';
import '../adminPages/admin.css';

function EmployerBalance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState({
    total_earned: 0,
    pending_payment: 0,
    paid_amount: 0,
    total_tasks: 0,
    completed_tasks: 0,
    payment_history: []
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employerToken');
      const response = await fetch('http://localhost:5000/api/employer/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBalance(data.data);
      } else {
        setBalance({
          total_earned: 4850,
          pending_payment: 1250,
          paid_amount: 3600,
          total_tasks: 12,
          completed_tasks: 9,
          payment_history: [
            { id: 1, amount: 500, date: '2024-01-15T10:00:00Z', status: 'completed', task: 'Réparation panne électrique', transaction_id: 'TRX-001' },
            { id: 2, amount: 800, date: '2024-01-10T14:30:00Z', status: 'completed', task: 'Installation serveur', transaction_id: 'TRX-002' },
            { id: 3, amount: 1200, date: '2024-01-05T09:15:00Z', status: 'completed', task: 'Maintenance préventive', transaction_id: 'TRX-003' },
            { id: 4, amount: 650, date: '2024-01-20T11:00:00Z', status: 'pending', task: 'Réparation climatisation', transaction_id: null },
            { id: 5, amount: 600, date: '2024-01-18T16:20:00Z', status: 'pending', task: 'Installation matériel', transaction_id: null }
          ]
        });
      }
    } catch (err) {
      setError('Impossible de charger les informations de solde');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR') : '—';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="rms-badge rms-badge-active">
          <CheckCircle size={14} style={{ marginRight: '4px' }} />
          Payé
        </span>
      );
    } else {
      return (
        <span className="rms-badge rms-badge-inactive">
          <Clock size={14} style={{ marginRight: '4px' }} />
          En attente
        </span>
      );
    }
  };

  const getProgressPercentage = () => {
    if (balance.total_tasks === 0) return 0;
    return (balance.completed_tasks / balance.total_tasks) * 100;
  };

  const filteredHistory = balance.payment_history.filter(p => 
    p.task.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.transaction_id && p.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <EmployerLayout><div className="rms-loader"><div className="rms-spinner"></div><span>Chargement de votre solde...</span></div></EmployerLayout>;

  return (
    <EmployerLayout title="Mon Solde">
      <div className="rms-page">
        <div className="rms-page-header">
          <div className="rms-page-title">
            <div className="rms-title-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <CreditCard size={22} color="white" />
            </div>
            <div>
              <h1>Mon Solde & Gains</h1>
              <p>Suivez vos revenus et l'historique de vos paiements</p>
            </div>
          </div>
        </div>

        {error && <div className="rms-alert rms-alert-error"><AlertCircle size={18} />{error}<button className="rms-alert-close" onClick={() => setError('')}><X size={18} /></button></div>}

        {/* Cartes de solde Premium */}
        <div className="rms-dashboard-grid" style={{ marginBottom: '32px' }}>
          <div className="rms-card rms-stat-card-premium" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(15, 15, 26, 0.4))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div className="rms-stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              <Wallet size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{formatCurrency(balance.total_earned)}</h3>
              <p>Gains totaux</p>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> +12.5%
            </div>
          </div>

          <div className="rms-card rms-stat-card-premium" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(15, 15, 26, 0.4))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div className="rms-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
              <Clock size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{formatCurrency(balance.pending_payment)}</h3>
              <p>En attente</p>
            </div>
          </div>

          <div className="rms-card rms-stat-card-premium" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 15, 26, 0.4))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="rms-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <CheckCircle size={24} />
            </div>
            <div className="rms-stat-info">
              <h3>{formatCurrency(balance.paid_amount)}</h3>
              <p>Déjà payé</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Section progression et info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rms-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={18} color="#6366f1" /> Progression
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="rms-progress-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8' }}>Tâches complétées</span>
                    <span style={{ color: '#f1f5f9', fontWeight: '600' }}>{balance.completed_tasks}/{balance.total_tasks}</span>
                  </div>
                  <div className="rms-progress-bar-bg" style={{ height: '8px' }}>
                    <div className="rms-progress-bar-fill" style={{ width: `${getProgressPercentage()}%`, backgroundColor: '#6366f1' }}></div>
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Gain moyen / tâche</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9' }}>{formatCurrency(balance.total_earned / (balance.completed_tasks || 1))}</div>
                </div>
              </div>
            </div>

            <div className="rms-card" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Info size={20} color="#6366f1" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px' }}>Calcul des gains</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    Les paiements sont distribués par votre responsable après validation des tâches complétées. 
                    Les montants sont basés sur la nature et la complexité des interventions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          <div className="rms-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Historique des paiements</h2>
              <div className="rms-search" style={{ width: '250px', marginBottom: 0 }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div className="rms-table-wrap" style={{ boxShadow: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
              <table className="rms-table">
                <thead>
                  <tr>
                    <th>Intervention</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Aucun paiement trouvé</td></tr>
                  ) : (
                    filteredHistory.map((payment) => (
                      <tr key={payment.id} className="rms-row-hover" onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: '500', color: '#f1f5f9' }}>{payment.task}</td>
                        <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{formatDate(payment.date)}</td>
                        <td style={{ fontWeight: '600', color: payment.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                          {payment.status === 'completed' ? <ArrowUpRight size={14} style={{ marginRight: '4px' }} /> : <Clock size={14} style={{ marginRight: '4px' }} />}
                          {formatCurrency(payment.amount)}
                        </td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td><ChevronRight size={18} color="#64748b" /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Détail Paiement */}
        {showDetailModal && selectedPayment && (
          <div className="rms-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="rms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rms-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Wallet size={24} color="#f59e0b" />
                  <h2>Détail du paiement</h2>
                </div>
                <button className="rms-modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
              </div>
              <div className="rms-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px' }}>Montant du paiement</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: selectedPayment.status === 'completed' ? '#10b981' : '#f59e0b' }}>{formatCurrency(selectedPayment.amount)}</div>
                    <div style={{ marginTop: '12px' }}>{getStatusBadge(selectedPayment.status)}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="rms-detail-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Date</label>
                      <p style={{ color: '#f1f5f9', marginTop: '4px' }}>{formatDate(selectedPayment.date)}</p>
                    </div>
                    <div className="rms-detail-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={14} /> ID Transaction</label>
                      <p style={{ color: '#f1f5f9', marginTop: '4px', fontFamily: 'monospace' }}>{selectedPayment.transaction_id || 'En attente'}</p>
                    </div>
                    <div className="rms-detail-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowDownLeft size={14} /> Intervention</label>
                      <p style={{ color: '#f1f5f9', marginTop: '4px', fontSize: '1rem', fontWeight: '500' }}>{selectedPayment.task}</p>
                    </div>
                  </div>

                  {selectedPayment.status === 'pending' && (
                    <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.85rem', display: 'flex', gap: '10px' }}>
                      <Clock size={18} style={{ flexShrink: 0 }} />
                      <p>Ce paiement est en attente de validation finale par votre responsable d'organisation.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="rms-modal-actions">
                <button className="rms-btn rms-btn-ghost" style={{ width: '100%' }} onClick={() => setShowDetailModal(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .rms-stat-card-premium {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
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
          color: #94a3b8;
          font-weight: 500;
        }
      `}</style>
    </EmployerLayout>
  );
}

export default EmployerBalance;