import React from 'react';
import { WebSupplier } from '../../types/suppliers';

interface DeleteSupplierDialogProps {
  isOpen: boolean;
  supplier: WebSupplier | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteSupplierDialog: React.FC<DeleteSupplierDialogProps> = ({
  isOpen,
  supplier,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !supplier) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#dc2626' }}>Delete Supplier</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            Are you sure you want to delete supplier <strong>{supplier.partyName}</strong> ({supplier.id})?
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            This will permanently remove the supplier record from your CRM database.
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
            Delete Supplier
          </button>
        </div>
      </div>
    </div>
  );
};
