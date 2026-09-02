import React from 'react';
import { WebSupplierLedgerEntry } from '../../types/supplierledger';

interface DeleteSupplierLedgerDialogProps {
  isOpen: boolean;
  entry: WebSupplierLedgerEntry | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteSupplierLedgerDialog: React.FC<DeleteSupplierLedgerDialogProps> = ({
  isOpen,
  entry,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !entry) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#dc2626' }}>Delete Ledger Entry?</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            Are you sure you want to delete entry <strong>"{entry.transactionType}" (₹{entry.amount.toFixed(2)})</strong> for <strong>"{entry.supplierName}"</strong>?
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            This action cannot be undone and will recalculate supplier payable balances immediately.
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
            Delete Entry
          </button>
        </div>
      </div>
    </div>
  );
};
