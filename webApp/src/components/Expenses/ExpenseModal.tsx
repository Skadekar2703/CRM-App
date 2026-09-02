import React, { useState, useEffect } from 'react';
import { WebExpense } from '../../types/expenses';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense: WebExpense | null;
  onClose: () => void;
  onSave: (
    date: string,
    category: string,
    amount: number,
    paymentMode: string,
    paidTo?: string,
    description?: string
  ) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  editingExpense,
  onClose,
  onSave
}) => {
  const [date, setDate] = useState('29 Aug 2026');
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setCategory(editingExpense.category);
      setAmount(editingExpense.amount ? String(editingExpense.amount) : '');
      setPaymentMode(editingExpense.paymentMode);
      setPaidTo(editingExpense.paidTo || '');
      setDescription(editingExpense.description || '');
    } else {
      setDate('29 Aug 2026');
      setCategory('Rent');
      setAmount('');
      setPaymentMode('Cash');
      setPaidTo('');
      setDescription('');
    }
    setErrorMsg('');
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim()) {
      setErrorMsg('Date is required');
      return;
    }
    if (!category.trim()) {
      setErrorMsg('Category is required');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Amount must be greater than 0');
      return;
    }

    onSave(
      date.trim(),
      category.trim(),
      numAmount,
      paymentMode,
      paidTo.trim(),
      description.trim()
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
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
              <label>Expense Date *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 14 Jun 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Fuel">Fuel</option>
                <option value="Tea & Snacks">Tea & Snacks</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Salaries">Salaries</option>
                <option value="Other">Other</option>
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
                placeholder="e.g. 1200.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Mode *</label>
              <select className="form-control" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Paid To (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Landlord / Electricity Board"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter expense details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari">
              {editingExpense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
