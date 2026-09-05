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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatIsoToDisplay = (isoStr: string): string => {
  if (!isoStr) return '';
  const clean = isoStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${MONTHS[monthIdx]} ${year}`;
    }
  }
  return isoStr;
};

export const parseAnyToIso = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.trim().split(/[\s-]+/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === parts[1].toLowerCase());
      const monthNum = monthIdx >= 0 ? String(monthIdx + 1).padStart(2, '0') : parts[1].padStart(2, '0');
      return `${parts[0]}-${monthNum}-${parts[2].padStart(2, '0')}`;
    } else {
      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1];
      const year = parts[2];
      const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === monthStr.toLowerCase());
      if (monthIdx >= 0) {
        const monthNum = String(monthIdx + 1).padStart(2, '0');
        return `${year}-${monthNum}-${day}`;
      }
    }
  }
  return dateStr;
};

const getTodayIso = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [issueDateIso, setIssueDateIso] = useState(getTodayIso());
  const [dueDateIso, setDueDateIso] = useState(getTodayIso());
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
      setIssueDateIso(parseAnyToIso(editingCheque.issueDate) || getTodayIso());
      setDueDateIso(parseAnyToIso(editingCheque.dueDate) || getTodayIso());
      setStatus(editingCheque.status);
      setNotes(editingCheque.notes);
    } else {
      setChequeNo('');
      setPartyName('');
      setBankName('HDFC Bank');
      setAmount('');
      setDirection('Inward');
      const today = getTodayIso();
      setIssueDateIso(today);
      setDueDateIso(today);
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

    if (!issueDateIso) {
      setErrorMsg('Issue Date is required.');
      return;
    }

    if (dueDateIso && issueDateIso && dueDateIso < issueDateIso) {
      setErrorMsg('Due Date cannot be earlier than Issue Date.');
      return;
    }

    onSave(
      chequeNo.trim() || 'CHQ-2023-' + Math.floor(1000 + Math.random() * 9000),
      partyName.trim(),
      bankName.trim() || 'HDFC Bank',
      amtNum,
      direction,
      formatIsoToDisplay(issueDateIso),
      formatIsoToDisplay(dueDateIso),
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
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #fecaca' }}>
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
              <label className="form-label">Issue Date *</label>
              <div
                className="date-picker-input-field"
                onClick={(e) => {
                  const inputEl = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                  if (inputEl && typeof inputEl.showPicker === 'function') {
                    try { inputEl.showPicker(); } catch {}
                  }
                }}
              >
                <span className="date-picker-value-text">
                  {formatIsoToDisplay(issueDateIso) || 'Select Issue Date'}
                </span>
                <span className="date-picker-calendar-icon">📅</span>
                <input
                  type="date"
                  className="date-input-overlay"
                  value={issueDateIso}
                  onChange={(e) => {
                    setIssueDateIso(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <div
                className="date-picker-input-field"
                onClick={(e) => {
                  const inputEl = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                  if (inputEl && typeof inputEl.showPicker === 'function') {
                    try { inputEl.showPicker(); } catch {}
                  }
                }}
              >
                <span className="date-picker-value-text">
                  {formatIsoToDisplay(dueDateIso) || 'Select Due Date'}
                </span>
                <span className="date-picker-calendar-icon">📅</span>
                <input
                  type="date"
                  className="date-input-overlay"
                  value={dueDateIso}
                  onChange={(e) => {
                    setDueDateIso(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </div>
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

