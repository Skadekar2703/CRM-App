import React from 'react';
import { WebReminder } from '../../types/reminders';

interface DeleteReminderDialogProps {
  isOpen: boolean;
  reminder: WebReminder | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteReminderDialog: React.FC<DeleteReminderDialogProps> = ({
  isOpen,
  reminder,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !reminder) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#dc2626' }}>Delete Reminder?</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            Are you sure you want to delete the <strong>{reminder.type}</strong> reminder for <strong>"{reminder.customerName}"</strong>?
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            This action cannot be undone and will permanently remove this reminder.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-udhaari"
            style={{ backgroundColor: '#dc2626' }}
            onClick={onConfirm}
          >
            Delete Reminder
          </button>
        </div>
      </div>
    </div>
  );
};
