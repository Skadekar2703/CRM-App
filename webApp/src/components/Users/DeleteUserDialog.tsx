import React from 'react';
import { WebUser } from '../../types/users';

interface DeleteUserDialogProps {
  isOpen: boolean;
  user: WebUser | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ isOpen, user, onClose, onConfirm }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#dc2626' }}>Delete User Account?</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            Are you sure you want to delete the user account for <strong>"{user.username}" ({user.email})</strong>?
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            This action will revoke all system access for this account immediately.
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
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};
