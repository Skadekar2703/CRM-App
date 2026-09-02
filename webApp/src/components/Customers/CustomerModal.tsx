import React, { useState, useEffect } from 'react';
import { WebCustomer } from '../../types/customers';

interface CustomerModalProps {
  isOpen: boolean;
  editingCustomer: WebCustomer | null;
  onClose: () => void;
  onSave: (
    name: string,
    mobile: string,
    area: string,
    category: string,
    cibilScore: number,
    cibilStatus: 'Good' | 'Average' | 'Bad' | 'Normal',
    creditLimit: number,
    baakiAmount: number,
    jamaAmount: number,
    status: 'Active' | 'Inactive'
  ) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  editingCustomer,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('Regular');
  const [cibilScore, setCibilScore] = useState('750');
  const [creditLimit, setCreditLimit] = useState('100000');
  const [baakiAmount, setBaakiAmount] = useState('0');
  const [jamaAmount, setJamaAmount] = useState('0');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setMobile(editingCustomer.mobile);
      setArea(editingCustomer.area);
      setCategory(editingCustomer.category || 'Regular');
      setCibilScore(editingCustomer.cibilScore ? editingCustomer.cibilScore.toString() : '750');
      setCreditLimit(editingCustomer.creditLimit ? editingCustomer.creditLimit.toString() : '100000');
      setBaakiAmount(editingCustomer.baakiAmount ? editingCustomer.baakiAmount.toString() : editingCustomer.balanceType === 'Baki' ? editingCustomer.balance.toString() : '0');
      setJamaAmount(editingCustomer.jamaAmount ? editingCustomer.jamaAmount.toString() : editingCustomer.balanceType === 'Jama' ? editingCustomer.balance.toString() : '0');
      setStatus(editingCustomer.status || 'Active');
    } else {
      setName('');
      setMobile('');
      setArea('');
      setCategory('Regular');
      setCibilScore('750');
      setCreditLimit('100000');
      setBaakiAmount('0');
      setJamaAmount('0');
      setStatus('Active');
    }
    setErrorMsg('');
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Customer Name is required');
      return;
    }

    const score = parseInt(cibilScore, 10) || 750;
    const limit = parseFloat(creditLimit);
    const baki = parseFloat(baakiAmount) || 0;
    const jama = parseFloat(jamaAmount) || 0;

    if (isNaN(limit) || limit < 0) {
      setErrorMsg('Credit Limit must be a valid non-negative number');
      return;
    }

    if (isNaN(baki) || baki < 0) {
      setErrorMsg('Baaki Amount cannot be negative');
      return;
    }

    if (isNaN(jama) || jama < 0) {
      setErrorMsg('Jama Amount cannot be negative');
      return;
    }

    const calculatedCibilStatus: 'Good' | 'Average' | 'Bad' | 'Normal' =
      score >= 750 ? 'Good' : score >= 650 ? 'Average' : 'Bad';

    onSave(
      name.trim(),
      mobile.trim(),
      area.trim() || 'General Area',
      category,
      score,
      calculatedCibilStatus,
      limit,
      baki,
      jama,
      status
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, padding: '8px 16px', backgroundColor: '#fef2f2', borderRadius: '6px', margin: '12px 16px 0' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Customer Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Sharma Hardware"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Area / Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Nawgaji Plot"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
            <div className="form-group">
              <label>CIBIL Score</label>
              <input
                type="number"
                className="form-control"
                placeholder="750"
                value={cibilScore}
                onChange={(e) => setCibilScore(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Credit Limit (₹)</label>
            <input
              type="number"
              className="form-control"
              placeholder="100000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
          </div>



          <div className="form-group">
            <label>Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
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
