import React from 'react';
import { Area } from '../../types/areas';
import './Areas.css';

interface DeleteAreaDialogProps {
  isOpen: boolean;
  area: Area | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAreaDialog: React.FC<DeleteAreaDialogProps> = ({ isOpen, area, onClose, onConfirm }) => {
  if (!isOpen || !area) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            ⚠️
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Delete Area</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Are you sure you want to delete <strong>"{area.name}"</strong>?
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ backgroundColor: '#dc2626' }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
