import React, { useState, useEffect } from 'react';
import { WebEmployee, WebEmployeeTransaction } from '../../types/employees';

interface EmployeeTransactionModalProps {
  isOpen: boolean;
  employee: WebEmployee | null;
  defaultType?: 'Gift' | 'Bonus' | 'Extra Payment' | 'Employee Udhaar' | 'Labour Expense' | 'Udhaar Repayment';
  onClose: () => void;
  onSave: (transactionData: {
    employeeId: string;
    employeeUid?: string;
    type: 'Gift' | 'Bonus' | 'Extra Payment' | 'Employee Udhaar' | 'Labour Expense' | 'Udhaar Repayment';
    amount: number;
    date: string;
    note?: string;
  }) => void;
}

export const EmployeeTransactionModal: React.FC<EmployeeTransactionModalProps> = ({
  isOpen,
  employee,
  defaultType = 'Gift',
  onClose,
  onSave
}) => {
  const [type, setType] = useState<WebEmployeeTransaction['type']>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setErrorMsg('');
    }
  }, [isOpen, defaultType]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (!employee.id) {
      setErrorMsg('Employee ID is missing.');
      return;
    }

    onSave({
      employeeId: employee.id,
      employeeUid: employee.uid,
      type,
      amount: numAmount,
      date,
      note: note.trim() || undefined
    });
    onClose();
  };

  const getBadgeStyle = (txType: string) => {
    switch (txType) {
      case 'Gift':
        return { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' };
      case 'Bonus':
        return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
      case 'Extra Payment':
        return { bg: '#e0e7ff', color: '#4338ca', border: '#a5b4fc' };
      case 'Employee Udhaar':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      case 'Udhaar Repayment':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' };
      case 'Labour Expense':
        return { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Record Financial Entry</h3>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Employee: <strong>{employee.name}</strong> ({employee.uid})
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #fecaca', marginBottom: '12px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Transaction Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['Gift', 'Bonus', 'Extra Payment', 'Employee Udhaar', 'Udhaar Repayment', 'Labour Expense'] as const).map((t) => {
                const isSelected = type === t;
                const style = getBadgeStyle(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${style.color}` : `1px solid ${style.border}`,
                      backgroundColor: isSelected ? style.bg : '#f9fafb',
                      color: isSelected ? style.color : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t === 'Gift' && '🎁 '}
                    {t === 'Bonus' && '⭐ '}
                    {t === 'Extra Payment' && '💸 '}
                    {t === 'Employee Udhaar' && '📉 '}
                    {t === 'Udhaar Repayment' && '📈 '}
                    {t === 'Labour Expense' && '🛠️ '}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 5000"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (errorMsg) setErrorMsg(''); }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note / Reason / Reference</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Festival bonus / Advance for emergency home repairs"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-item">
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
