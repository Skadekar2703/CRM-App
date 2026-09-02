import React, { useState } from 'react';

interface CashBookEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, particulars: string, type: 'IN' | 'OUT', amount: number, sourceModule: string) => void;
}

export const CashBookEntryModal: React.FC<CashBookEntryModalProps> = ({ isOpen, onClose, onSave }) => {
  const [date, setDate] = useState('2026-08-29');
  const [particulars, setParticulars] = useState('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [amount, setAmount] = useState('');
  const [sourceModule, setSourceModule] = useState('Manual');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setErrorMsg('Date is required');
      return;
    }
    if (!particulars.trim()) {
      setErrorMsg('Particulars/Description is required');
      return;
    }
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setErrorMsg('Amount must be greater than 0');
      return;
    }

    onSave(date, particulars.trim(), type, numAmt, sourceModule);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>+ Add Cash Transaction</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, padding: '8px 16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Transaction Date *</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Direction (IN / OUT) *</label>
              <select
                className="form-control"
                value={type}
                onChange={(e) => setType(e.target.value as 'IN' | 'OUT')}
              >
                <option value="IN">Cash IN (Receipt)</option>
                <option value="OUT">Cash OUT (Payment)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 5000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Source / Category</label>
              <select
                className="form-control"
                value={sourceModule}
                onChange={(e) => setSourceModule(e.target.value)}
              >
                <option value="Manual">Manual Entry</option>
                <option value="Sales">Sales</option>
                <option value="Expenses">Expenses</option>
                <option value="Supplier Ledger">Supplier Ledger</option>
                <option value="Udhaari">Udhaari</option>
                <option value="Cheques">Cheques</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Particulars / Description *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter transaction details (e.g. Cash sale, Rent payment)..."
              value={particulars}
              onChange={(e) => setParticulars(e.target.value)}
              required
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: '#2563eb' }}>
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
