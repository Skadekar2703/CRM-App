import React, { useState, useEffect } from 'react';
import { UdhaariCustomer } from '../../types/udhaari';

interface UdhaariTransactionModalProps {
  isOpen: boolean;
  customers: UdhaariCustomer[];
  initialType?: 'Baki' | 'Jama';
  initialCustomerUid?: string;
  onClose: () => void;
  onSave: (customerUid: string, type: 'Baki' | 'Jama', amount: number, notes: string) => void;
}

export const UdhaariTransactionModal: React.FC<UdhaariTransactionModalProps> = ({
  isOpen,
  customers,
  initialType = 'Baki',
  initialCustomerUid = '',
  onClose,
  onSave,
}) => {
  const [customerUid, setCustomerUid] = useState('');
  const [type, setType] = useState<'Baki' | 'Jama'>('Baki');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCustomerUid && customers.some((c) => c.uid === initialCustomerUid)) {
        setCustomerUid(initialCustomerUid);
      } else if (customers.length > 0) {
        setCustomerUid(customers[0].uid);
      }
      setType(initialType);
      setAmount('');
      setNotes('');
      setErrorMsg(null);
    }
  }, [isOpen, customers, initialType, initialCustomerUid]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUid) {
      setErrorMsg('Please select a customer.');
      return;
    }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg('Please enter a valid transaction amount.');
      return;
    }

    onSave(customerUid, type, amtNum, notes.trim() || `${type} entry`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Record {type} Transaction</h3>
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

          <div className="form-group">
            <label className="form-label">Select Customer *</label>
            {customers.length === 0 ? (
              <div style={{ padding: '10px', backgroundColor: '#fffbebfb', color: '#b45309', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                ⚠️ No customers found in database. Please create a customer in the Customers screen first.
              </div>
            ) : (
              <select
                className="form-input"
                value={customerUid}
                onChange={(e) => setCustomerUid(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name} ({c.mobile || c.area})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Type *</label>
            <div className="radio-group">
              <label className="radio-label" style={{ color: '#dc2626', fontWeight: 700 }}>
                <input
                  type="radio"
                  name="txnType"
                  value="Baki"
                  checked={type === 'Baki'}
                  onChange={() => setType('Baki')}
                />
                Baki (Give Credit/Debt)
              </label>
              <label className="radio-label" style={{ color: '#16a34a', fontWeight: 700 }}>
                <input
                  type="radio"
                  name="txnType"
                  value="Jama"
                  checked={type === 'Jama'}
                  onChange={() => setType('Jama')}
                />
                Jama (Receive Payment/Credit)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="e.g. 5000.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Reference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Goods sale or Cash receipt"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: type === 'Baki' ? '#dc2626' : '#16a34a' }}>
              Save {type} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
