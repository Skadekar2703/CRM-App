import React, { useState, useEffect } from 'react';
import { Cheque } from '../../types/cheques';

interface ChequeModalProps {
  isOpen: boolean;
  editingCheque: Cheque | null;
  onClose: () => void;
  onSave: (
    chequeNo: string,
    partyName: string,
    bankName: string,
    amount: number,
    direction: 'Inward' | 'Outward',
    issueDate: string,
    dueDate: string,
    status: 'Pending' | 'Cleared' | 'Bounced',
    notes: string
  ) => void;
}

export const ChequeModal: React.FC<ChequeModalProps> = ({
  isOpen,
  editingCheque,
  onClose,
  onSave,
}) => {
  const [chequeNo, setChequeNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'Inward' | 'Outward'>('Inward');
  const [issueDate, setIssueDate] = useState('Oct 12, 2023');
  const [dueDate, setDueDate] = useState('Oct 25, 2023');
  const [status, setStatus] = useState<'Pending' | 'Cleared' | 'Bounced'>('Pending');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingCheque) {
      setChequeNo(editingCheque.chequeNo);
      setPartyName(editingCheque.partyName);
      setBankName(editingCheque.bankName);
      setAmount(editingCheque.amount.toString());
      setDirection(editingCheque.direction);
      setIssueDate(editingCheque.issueDate);
      setDueDate(editingCheque.dueDate);
      setStatus(editingCheque.status);
      setNotes(editingCheque.notes);
    } else {
      setChequeNo('');
      setPartyName('');
      setBankName('HDFC Bank');
      setAmount('');
      setDirection('Inward');
      setIssueDate('Oct 12, 2023');
      setDueDate('Oct 25, 2023');
      setStatus('Pending');
      setNotes('');
    }
    setErrorMsg(null);
  }, [editingCheque, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      setErrorMsg('Party Name is required.');
      return;
    }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    onSave(
      chequeNo.trim() || 'CHQ-2023-' + Math.floor(1000 + Math.random() * 9000),
      partyName.trim(),
      bankName.trim() || 'HDFC Bank',
      amtNum,
      direction,
      issueDate.trim() || 'Oct 12, 2023',
      dueDate.trim() || 'Oct 25, 2023',
      status,
      notes.trim()
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingCheque ? 'Edit Cheque' : 'Add New Cheque'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Party / Company Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Acme Corp"
                value={partyName}
                onChange={(e) => {
                  setPartyName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cheque Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CHQ-2023-0891"
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HDFC Bank or ICICI Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="45000.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Direction</label>
              <select className="form-input" value={direction} onChange={(e) => setDirection(e.target.value as any)}>
                <option value="Inward">Inward (Received)</option>
                <option value="Outward">Outward (Issued)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Pending">Pending</option>
                <option value="Cleared">Cleared</option>
                <option value="Bounced">Bounced</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Oct 12, 2023"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Oct 25, 2023"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Reference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Client payment for Invoice #1024"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-item">
              {editingCheque ? 'Save Changes' : 'Add Cheque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
