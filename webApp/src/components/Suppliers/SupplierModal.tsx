import React, { useState, useEffect } from 'react';
import { WebSupplier } from '../../types/suppliers';

interface SupplierModalProps {
  isOpen: boolean;
  editingSupplier: WebSupplier | null;
  onClose: () => void;
  onSave: (
    partyName: string,
    contactPerson: string,
    mobile: string,
    email: string,
    paymentTerms: string,
    address: string,
    status: 'Active' | 'Inactive'
  ) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  editingSupplier,
  onClose,
  onSave
}) => {
  const [partyName, setPartyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingSupplier) {
      setPartyName(editingSupplier.partyName);
      setContactPerson(editingSupplier.contactPerson);
      setMobile(editingSupplier.mobile);
      setEmail(editingSupplier.email);
      setPaymentTerms(editingSupplier.paymentTerms || 'Net 30 Days');
      setAddress(editingSupplier.address);
      setStatus(editingSupplier.status || 'Active');
    } else {
      setPartyName('');
      setContactPerson('');
      setMobile('');
      setEmail('');
      setPaymentTerms('Net 30 Days');
      setAddress('');
      setStatus('Active');
    }
    setErrorMsg('');
  }, [editingSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      setErrorMsg('Party / Supplier Name is required');
      return;
    }

    onSave(
      partyName.trim(),
      contactPerson.trim() || 'Contact Person',
      mobile.trim(),
      email.trim(),
      paymentTerms,
      address.trim(),
      status
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
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
            <label>Supplier / Party Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Acme Global Supplies"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Contact Person</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jane Doe"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+1 (555) 123-4567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="jane@acmeglobal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select
                className="form-control"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Advance / Cash">Advance / Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Address / Facility Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="Industrial Area, Phase 2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
              {editingSupplier ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
