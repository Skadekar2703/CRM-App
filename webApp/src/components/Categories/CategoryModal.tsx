import React, { useState, useEffect } from 'react';
import { Category } from '../../types/categories';

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  onClose: () => void;
  onSave: (name: string, type: 'Item Category' | 'Customer Category', status: 'Active' | 'Inactive', subText?: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  editingCategory,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'Item Category' | 'Customer Category'>('Item Category');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [subText, setSubText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setStatus(editingCategory.status === 'Archived' ? 'Inactive' : editingCategory.status);
      setSubText(editingCategory.subText || '');
    } else {
      setName('');
      setType('Item Category');
      setStatus('Active');
      setSubText('');
    }
    setErrorMsg(null);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category Name is required.');
      return;
    }
    onSave(name.trim(), type, status, subText.trim() || undefined);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Electronics or Wholesaler"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category Type *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="categoryType"
                  value="Item Category"
                  checked={type === 'Item Category'}
                  onChange={() => setType('Item Category')}
                />
                Item Category
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="categoryType"
                  value="Customer Category"
                  checked={type === 'Customer Category'}
                  onChange={() => setType('Customer Category')}
                />
                Customer Category
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="categoryStatus"
                  value="Active"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                />
                Active
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="categoryStatus"
                  value="Inactive"
                  checked={status === 'Inactive'}
                  onChange={() => setStatus('Inactive')}
                />
                Inactive / Archived
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Subtext (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Consumer goods & tech"
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-web">
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
