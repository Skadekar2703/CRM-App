import React from 'react';
import { WebStockMovement } from '../../types/daag';

interface DeleteDaagDialogProps {
  isOpen: boolean;
  movement: WebStockMovement | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteDaagDialog: React.FC<DeleteDaagDialogProps> = ({
  isOpen,
  movement,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !movement) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#dc2626' }}>Delete Movement</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            Are you sure you want to delete movement record <strong>{movement.id}</strong> ({movement.item})?
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            This will permanently remove the stock transit record.
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
            Delete Movement
          </button>
        </div>
      </div>
    </div>
  );
};
