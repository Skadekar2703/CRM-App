import React, { useState, useEffect } from 'react';
import { UdhaariCustomer, UdhaariTransaction } from '../../types/udhaari';
import { supabase } from '../../lib/supabase';
import { formatIndianCurrency } from './WebUdhaariScreen';

interface UdhaariHistoryModalProps {
  isOpen: boolean;
  customer: UdhaariCustomer | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const UdhaariHistoryModal: React.FC<UdhaariHistoryModalProps> = ({
  isOpen,
  customer,
  onClose,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState<UdhaariTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTxn, setEditingTxn] = useState<UdhaariTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'Baki' | 'Jama'>('Baki');
  const [editNotes, setEditNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('udhaari')
        .select('*')
        .or(`customer_id.eq.${customer.uid},customer_name.eq.${customer.name}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(
          data.map((t: any) => ({
            id: String(t.id),
            customerUid: String(t.customer_id || customer.uid),
            customerName: t.customer_name || customer.name,
            type: t.type === 'Udhaar' || t.type === 'Baki' ? 'Baki' : 'Jama',
            amount: Number(t.amount || 0),
            date: t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : 'Recent',
            notes: t.notes || ''
          }))
        );
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error('Error fetching transaction history:', e);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      fetchHistory();
      setEditingTxn(null);
      setMsg(null);
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const recalculateCustomer = async (custUid: string) => {
    const { data: txns } = await supabase
      .from('udhaari')
      .select('type, amount')
      .or(`customer_id.eq.${custUid},customer_name.eq.${customer.name}`);

    let totalBakiGiven = 0;
    let jamaSum = 0;
    if (txns) {
      txns.forEach((t: any) => {
        const amt = Number(t.amount || 0);
        if (t.type === 'Baki' || t.type === 'Udhaar') {
          totalBakiGiven += amt;
        } else if (t.type === 'Jama' || t.type === 'Payment' || t.type === 'Credit') {
          jamaSum += amt;
        }
      });
    }

    await supabase.from('customers').update({ baki: totalBakiGiven, jama: jamaSum }).eq('id', custUid);
  };

  const handleEditClick = (txn: UdhaariTransaction) => {
    setEditingTxn(txn);
    setEditAmount(txn.amount.toString());
    setEditType(txn.type);
    setEditNotes(txn.notes);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;
    const amtNum = parseFloat(editAmount);
    if (isNaN(amtNum) || amtNum <= 0) return;

    try {
      await supabase
        .from('udhaari')
        .update({
          type: editType,
          amount: amtNum,
          notes: editNotes.trim()
        })
        .eq('id', editingTxn.id);

      await recalculateCustomer(customer.uid);
      setMsg('Transaction updated successfully.');
      setEditingTxn(null);
      await fetchHistory();
      onRefresh();
    } catch (err) {
      console.error('Error updating transaction:', err);
    }
  };

  const handleDeleteTxn = async (txnId: string) => {
    try {
      await supabase.from('udhaari').delete().eq('id', txnId);
      await recalculateCustomer(customer.uid);
      setMsg('Transaction deleted.');
      await fetchHistory();
      onRefresh();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Transaction History — {customer.name}</h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Area: {customer.area} | Total Baki: <strong style={{ color: '#dc2626' }}>{formatIndianCurrency(customer.baki)}</strong> | Total Jama: <strong style={{ color: '#16a34a' }}>{formatIndianCurrency(customer.jama)}</strong>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {msg && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
              ✓ {msg}
            </div>
          )}

          {editingTxn ? (
            <form onSubmit={handleSaveEdit} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Edit Transaction Entry</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={editType} onChange={(e) => setEditType(e.target.value as any)}>
                    <option value="Baki">Baki (Give Credit)</option>
                    <option value="Jama">Jama (Receive Payment)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary-web" onClick={() => setEditingTxn(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-udhaari">
                  Save Entry
                </button>
              </div>
            </form>
          ) : null}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading transaction log...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
              No recorded transactions found for this customer.
            </div>
          ) : (
            <table className="udhaari-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{t.date}</td>
                    <td>
                      <span className={t.type === 'Baki' ? 'cibil-pill bad' : 'cibil-pill good'}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: t.type === 'Baki' ? '#dc2626' : '#16a34a' }}>
                      {formatIndianCurrency(t.amount)}
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>{t.notes || '-'}</td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn-icon" onClick={() => handleEditClick(t)} title="Edit Entry">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button className="action-btn-icon delete" onClick={() => handleDeleteTxn(t.id)} title="Delete Entry">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary-web" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
