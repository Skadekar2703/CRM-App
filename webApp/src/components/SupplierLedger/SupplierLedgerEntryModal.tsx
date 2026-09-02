import React, { useState, useEffect } from 'react';
import { WebSupplierLedgerEntry, INITIAL_WEB_SUPPLIERS } from '../../types/supplierledger';

interface SupplierLedgerEntryModalProps {
  isOpen: boolean;
  editingEntry: WebSupplierLedgerEntry | null;
  onClose: () => void;
  onSave: (
    supplierId: string,
    supplierName: string,
    date: string,
    transactionType: string,
    amount: number,
    reference?: string,
    paymentMode?: string,
    description?: string
  ) => void;
}

export const SupplierLedgerEntryModal: React.FC<SupplierLedgerEntryModalProps> = ({
  isOpen,
  editingEntry,
  onClose,
  onSave
}) => {
  const defaultSupId = INITIAL_WEB_SUPPLIERS.length > 0 ? INITIAL_WEB_SUPPLIERS[0].id : '';
  const [supplierId, setSupplierId] = useState(defaultSupId);
  const [date, setDate] = useState('29 Aug 2026');
  const [transactionType, setTransactionType] = useState('Purchase');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingEntry) {
      setSupplierId(editingEntry.supplierId);
      setDate(editingEntry.date);
      setTransactionType(editingEntry.transactionType);
      setAmount(editingEntry.amount ? String(editingEntry.amount) : '');
      setReference(editingEntry.reference || '');
      setPaymentMode(editingEntry.paymentMode || 'Cash');
      setDescription(editingEntry.description || '');
    } else {
      setSupplierId(defaultSupId);
      setDate('29 Aug 2026');
      setTransactionType('Purchase');
      setAmount('');
      setReference('');
      setPaymentMode('Cash');
      setDescription('');
    }
    setErrorMsg('');
  }, [editingEntry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMsg('Supplier is required');
      return;
    }
    if (!date.trim()) {
      setErrorMsg('Date is required');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setErrorMsg('Valid Amount is required');
      return;
    }

    const matchedSup = INITIAL_WEB_SUPPLIERS.find((s) => s.id === supplierId);
    const supName = matchedSup ? matchedSup.name : 'Supplier';

    onSave(
      supplierId,
      supName,
      date.trim(),
      transactionType,
      numAmount,
      reference.trim(),
      paymentMode,
      description.trim()
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2>{editingEntry ? 'Edit Ledger Entry' : 'Add Supplier Ledger Entry'}</h2>
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
          <div className="form-group">
            <label>Select Supplier *</label>
            <select
              className="form-control"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              {INITIAL_WEB_SUPPLIERS.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Transaction Date *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 29 Aug 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Transaction Type *</label>
              <select
                className="form-control"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                <option value="Purchase">Purchase</option>
                <option value="Payment">Payment</option>
                <option value="Return">Return</option>
                <option value="Opening Balance">Opening Balance</option>
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
                placeholder="e.g. 15000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select
                className="form-control"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Reference / Invoice Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. INV-9821 / PAY-4412"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description / Remarks</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter payment or purchase details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: '#16a34a' }}>
              {editingEntry ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
