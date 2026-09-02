import React, { useState, useEffect } from 'react';
import { Item } from '../../types/items';

interface ItemModalProps {
  isOpen: boolean;
  editingItem: Item | null;
  onClose: () => void;
  onSave: (
    name: string,
    brand: string,
    code: string,
    category: string,
    unit: string,
    lowStockAlert: number,
    salePrice: number,
    status: 'Active' | 'Low Stock' | 'Draft' | 'Inactive'
  ) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  editingItem,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [lowStockAlert, setLowStockAlert] = useState<number>(5);
  const [salePrice, setSalePrice] = useState<string>('0.00');
  const [status, setStatus] = useState<'Active' | 'Low Stock' | 'Draft' | 'Inactive'>('Active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setBrand(editingItem.brand);
      setCode(editingItem.code);
      setCategory(editingItem.category);
      setUnit(editingItem.unit);
      setLowStockAlert(editingItem.lowStockAlert);
      setSalePrice(editingItem.salePrice.toString());
      setStatus(editingItem.status);
    } else {
      setName('');
      setBrand('');
      setCode('');
      setCategory('Groceries');
      setUnit('Pcs');
      setLowStockAlert(5);
      setSalePrice('0.00');
      setStatus('Active');
    }
    setErrorMsg(null);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Item Name is required.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Item Code is required.');
      return;
    }
    if (!category.trim()) {
      setErrorMsg('Category is required.');
      return;
    }

    const priceNum = parseFloat(salePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Please enter a valid sale price.');
      return;
    }

    onSave(
      name.trim(),
      brand.trim(),
      code.trim(),
      category.trim(),
      unit.trim() || 'Pcs',
      lowStockAlert || 0,
      priceNum,
      status
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Basmati Rice 25kg or Premium Office Chair"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kohinoor or ErgoPlus"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Item Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ITM-001"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Groceries, Furniture, Health"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pcs, Bag, Bottle, Pack"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Alert</label>
              <input
                type="number"
                className="form-input"
                placeholder="5"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sale Price ($) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="45.99"
                value={salePrice}
                onChange={(e) => {
                  setSalePrice(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <div className="radio-group" style={{ flexWrap: 'wrap' }}>
              <label className="radio-label">
                <input
                  type="radio"
                  name="itemStatus"
                  value="Active"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                />
                Active
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="itemStatus"
                  value="Low Stock"
                  checked={status === 'Low Stock'}
                  onChange={() => setStatus('Low Stock')}
                />
                Low Stock
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="itemStatus"
                  value="Draft"
                  checked={status === 'Draft'}
                  onChange={() => setStatus('Draft')}
                />
                Draft
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="itemStatus"
                  value="Inactive"
                  checked={status === 'Inactive'}
                  onChange={() => setStatus('Inactive')}
                />
                Inactive
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-item">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
