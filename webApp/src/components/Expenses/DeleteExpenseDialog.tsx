import React from 'react';
import { WebExpense } from '../../types/expenses';

interface DeleteExpenseDialogProps {
  isOpen: boolean;
  expense: WebExpense | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteExpenseDialog: React.FC<DeleteExpenseDialogProps> = ({
  isOpen,
  expense,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#dc2626' }}>Delete Expense?</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
            Are you sure you want to delete the expense entry for <strong>"{expense.category}" (₹{expense.amount.toFixed(2)})</strong>?
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            This action cannot be undone and will update your expense totals immediately.
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
            Delete Expense
          </button>
        </div>
      </div>
    </div>
  );
};
