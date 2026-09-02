import React, { useState, useEffect } from 'react';
import { WebReminder } from '../../types/reminders';

interface ReminderModalProps {
  isOpen: boolean;
  editingReminder: WebReminder | null;
  onClose: () => void;
  onSave: (
    customerName: string,
    mobile: string,
    scheduledAt: string,
    type: string,
    priority: string,
    status: string,
    notes: string,
    customerId?: string
  ) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  editingReminder,
  onClose,
  onSave
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [type, setType] = useState('Call');
  const [priority, setPriority] = useState('Normal');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingReminder) {
      setCustomerName(editingReminder.customerName);
      setMobile(editingReminder.mobile);
      setScheduledAt(editingReminder.scheduledAt);
      setType(editingReminder.type);
      setPriority(editingReminder.priority);
      setStatus(editingReminder.status);
      setNotes(editingReminder.notes);
      setCustomerId(editingReminder.customerId || '');
    } else {
      setCustomerName('');
      setMobile('');
      setScheduledAt('2026-08-29 10:00 AM');
      setType('Call');
      setPriority('Normal');
      setStatus('Pending');
      setNotes('');
      setCustomerId('');
    }
    setErrorMsg('');
  }, [editingReminder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Customer Name is required');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile number is required');
      return;
    }
    if (!scheduledAt.trim()) {
      setErrorMsg('Date and Time are required');
      return;
    }

    onSave(
      customerName.trim(),
      mobile.trim(),
      scheduledAt.trim(),
      type,
      priority,
      status,
      notes.trim(),
      customerId.trim()
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h2>{editingReminder ? 'Edit Reminder' : 'Add New Reminder'}</h2>
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
              <label>Customer Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Imran Sheikh"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9821345678"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Scheduled Date & Time *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 29 Aug 2026, 10:00 AM"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Customer ID (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 100023"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Reminder Type</label>
              <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Call">Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Visit">Visit</option>
                <option value="Payment Follow-up">Payment Follow-up</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
                <option value="Snoozed">Snoozed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes / Follow-up Details</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Confirm cheque payment or discuss discount rates..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari">
              {editingReminder ? 'Save Changes' : 'Save Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
