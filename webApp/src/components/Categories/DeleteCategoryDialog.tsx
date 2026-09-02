import React from 'react';
import { Category } from '../../types/categories';

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  isOpen,
  category,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !category) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: '#dc2626' }}>
            Delete Category?
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#475569', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to delete category <strong>"{category.name}"</strong> ({category.type})? This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary-web" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary-web"
            style={{ backgroundColor: '#dc2626' }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete Category
          </button>
        </div>
      </div>
    </div>
  );
};
