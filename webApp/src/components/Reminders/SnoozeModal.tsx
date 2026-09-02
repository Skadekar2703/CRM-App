import React, { useState, useEffect } from 'react';
import { WebReminder } from '../../types/reminders';

interface SnoozeModalProps {
  isOpen: boolean;
  reminder: WebReminder | null;
  onClose: () => void;
  onSnooze: (newDateTime: string) => void;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  reminder,
  onClose,
  onSnooze
}) => {
  const [newDateTime, setNewDateTime] = useState('30 Aug 2026, 10:00 AM');

  useEffect(() => {
    if (reminder) {
      setNewDateTime(`${reminder.scheduledAt} (Postponed)`);
    }
  }, [reminder, isOpen]);

  if (!isOpen || !reminder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDateTime.trim()) {
      onSnooze(newDateTime.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>Snooze Reminder</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '13.5px', color: '#334155', margin: '0 0 12px 0' }}>
            Snooze reminder for <strong>{reminder.customerName}</strong> ({reminder.type}):
          </p>

          <div className="form-group">
            <label>New Scheduled Date & Time *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 30 Aug 2026, 10:00 AM"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: '#eab308' }}>
              Confirm Snooze
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
