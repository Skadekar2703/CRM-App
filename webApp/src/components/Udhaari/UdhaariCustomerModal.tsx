import React, { useState, useEffect } from 'react';
import { UdhaariCustomer } from '../../types/udhaari';

interface UdhaariCustomerModalProps {
  isOpen: boolean;
  editingCustomer: UdhaariCustomer | null;
  onClose: () => void;
  onSave: (
    name: string,
    mobile: string,
    area: string,
    category: string,
    cibilStatus: 'Good' | 'Average' | 'Bad',
    initialBalance: number,
    balanceType: 'Baki' | 'Jama',
    creditLimit: number,
    status: 'Active' | 'Inactive'
  ) => void;
}

export const UdhaariCustomerModal: React.FC<UdhaariCustomerModalProps> = ({
  isOpen,
  editingCustomer,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('Regular');
  const [cibilStatus, setCibilStatus] = useState<'Good' | 'Average' | 'Bad'>('Good');
  const [initialBalance, setInitialBalance] = useState('0.00');
  const [balanceType, setBalanceType] = useState<'Baki' | 'Jama'>('Baki');
  const [creditLimit, setCreditLimit] = useState('0.00');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setMobile(editingCustomer.mobile);
      setArea(editingCustomer.area);
      setCategory(editingCustomer.category);
      setCibilStatus(editingCustomer.cibilStatus);
      setInitialBalance(editingCustomer.balance.toString());
      setBalanceType(editingCustomer.balanceType);
      setCreditLimit(editingCustomer.creditLimit.toString());
      setStatus(editingCustomer.status);
    } else {
      setName('');
      setMobile('');
      setArea('Nawgaji Plot');
      setCategory('Regular');
      setCibilStatus('Good');
      setInitialBalance('0.00');
      setBalanceType('Baki');
      setCreditLimit('5000.00');
      setStatus('Active');
    }
    setErrorMsg(null);
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Customer Name is required.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile Number is required.');
      return;
    }

    const balNum = parseFloat(initialBalance);
    const limitNum = parseFloat(creditLimit);

    if (isNaN(balNum) || balNum < 0) {
      setErrorMsg('Please enter a valid initial balance.');
      return;
    }

    onSave(
      name.trim(),
      mobile.trim(),
      area.trim() || 'General Area',
      category.trim() || 'Regular',
      cibilStatus,
      balNum,
      balanceType,
      isNaN(limitNum) ? 0 : limitNum,
      status
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
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
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Adil or Sarah"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543219"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Area</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Nawgaji Plot or Civil Lines"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">CIBIL Status</label>
              <select className="form-input" value={cibilStatus} onChange={(e) => setCibilStatus(e.target.value as any)}>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Bad">Bad</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Credit Limit (₹)</label>
              <input
                type="number"
                step="100"
                className="form-input"
                placeholder="5000.00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </div>

            {!editingCustomer && (
              <>
                <div className="form-group">
                  <label className="form-label">Initial Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="2000.00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Balance Type</label>
                  <select className="form-input" value={balanceType} onChange={(e) => setBalanceType(e.target.value as any)}>
                    <option value="Baki">Baki (Give Credit)</option>
                    <option value="Jama">Jama (Advance/Payment)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari">
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
