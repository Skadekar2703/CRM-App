import React, { useState, useEffect } from 'react';
import { Transport } from '../../types/transports';

interface TransportModalProps {
  isOpen: boolean;
  editingTransport: Transport | null;
  onClose: () => void;
  onSave: (
    transportName: string,
    mobile: string,
    contactPerson: string,
    vehicleNumber: string,
    status: 'Active' | 'Inactive'
  ) => void;
}

export const TransportModal: React.FC<TransportModalProps> = ({
  isOpen,
  editingTransport,
  onClose,
  onSave,
}) => {
  const [transportName, setTransportName] = useState('');
  const [mobile, setMobile] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingTransport) {
      setTransportName(editingTransport.transportName);
      setMobile(editingTransport.mobile);
      setContactPerson(editingTransport.contactPerson);
      setVehicleNumber(editingTransport.vehicleNumber);
      setStatus(editingTransport.status);
    } else {
      setTransportName('');
      setMobile('');
      setContactPerson('');
      setVehicleNumber('');
      setStatus('Active');
    }
    setErrorMsg(null);
  }, [editingTransport, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportName.trim()) {
      setErrorMsg('Transport Name is required.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile number is required.');
      return;
    }
    if (!contactPerson.trim()) {
      setErrorMsg('Contact Person is required.');
      return;
    }

    onSave(
      transportName.trim(),
      mobile.trim(),
      contactPerson.trim(),
      vehicleNumber.trim(),
      status
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingTransport ? 'Edit Transport Entity' : 'Add New Transport Entity'}
          </h3>
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
            <label className="form-label">Transport / Company Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alpha Logistics Pvt Ltd"
              value={transportName}
              onChange={(e) => {
                setTransportName(e.target.value);
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
              placeholder="e.g. +91 98765 43210 or +1 (555) 123-4567"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Person *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rajesh Kumar or John Doe"
              value={contactPerson}
              onChange={(e) => {
                setContactPerson(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Number / Fleet Info</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. MH 12 AB 3456 or Fleet: 12 Vehicles"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="transportStatus"
                  value="Active"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                />
                Active
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="transportStatus"
                  value="Inactive"
                  checked={status === 'Inactive'}
                  onChange={() => setStatus('Inactive')}
                />
                Inactive
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-web">
              {editingTransport ? 'Save Changes' : 'Add Transport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
