import React, { useState, useEffect } from 'react';
import { WebStockMovement } from '../../types/daag';

interface ItemOption {
  id: string;
  name: string;
  sku?: string;
}

interface DaagModalProps {
  isOpen: boolean;
  editingMovement: WebStockMovement | null;
  availableItems?: ItemOption[];
  onClose: () => void;
  onSave: (
    direction: 'IN' | 'OUT',
    item: string,
    quantity: string,
    amount: number,
    supplier: string,
    transport: string,
    status: 'Complete' | 'Pending' | 'In Transit' | 'Cancelled',
    date: string,
    itemId?: string
  ) => void;
}

export const DaagModal: React.FC<DaagModalProps> = ({
  isOpen,
  editingMovement,
  availableItems = [],
  onClose,
  onSave
}) => {
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('0');
  const [supplier, setSupplier] = useState('');
  const [transport, setTransport] = useState('');
  const [status, setStatus] = useState<'Complete' | 'Pending' | 'In Transit' | 'Cancelled'>('Pending');
  const [date, setDate] = useState('Today');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingMovement) {
      setDirection(editingMovement.direction);
      setItem(editingMovement.item);
      setQuantity(editingMovement.quantity);
      setAmount(editingMovement.amount ? editingMovement.amount.toString() : '0');
      setSupplier(editingMovement.supplier === '—' ? '' : editingMovement.supplier);
      setTransport(editingMovement.transport === '—' ? '' : editingMovement.transport);
      setStatus(editingMovement.status);
      setDate(editingMovement.date);
    } else {
      setDirection('IN');
      if (availableItems.length > 0) {
        setSelectedItemId(availableItems[0].id);
        setItem(availableItems[0].name);
      } else {
        setSelectedItemId('');
        setItem('');
      }
      setQuantity('');
      setAmount('0');
      setSupplier('');
      setTransport('');
      setStatus('Pending');
      setDate('Today');
    }
    setErrorMsg('');
  }, [editingMovement, isOpen, availableItems]);

  if (!isOpen) return null;

  const handleItemSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedItemId(val);
    const matched = availableItems.find((i) => i.id === val);
    if (matched) {
      setItem(matched.name);
    } else {
      setItem(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) {
      setErrorMsg('Item Selection/Name is required');
      return;
    }

    const amt = parseFloat(amount) || 0;

    onSave(
      direction,
      item.trim(),
      quantity.trim() || '1 qty',
      amt,
      supplier.trim() || '—',
      transport.trim() || '—',
      status,
      date.trim() || 'Today',
      selectedItemId
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>{editingMovement ? 'Edit Stock Movement' : 'Add New Movement'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, padding: '8px 16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Movement Direction</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dirType"
                  value="IN"
                  checked={direction === 'IN'}
                  onChange={() => setDirection('IN')}
                />{' '}
                IN (Stock Received)
              </label>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dirType"
                  value="OUT"
                  checked={direction === 'OUT'}
                  onChange={() => setDirection('OUT')}
                />{' '}
                OUT (Stock Dispatched)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Select Item *</label>
            {availableItems.length > 0 ? (
              <select
                className="form-control"
                value={selectedItemId}
                onChange={handleItemSelectChange}
              >
                {availableItems.map((itm) => (
                  <option key={itm.id} value={itm.id}>
                    {itm.name} {itm.sku ? `(${itm.sku})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Basmati Rice 25kg"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                required
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="text"
                className="form-control"
                placeholder="2 bora / 5 peti / 50 units"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Supplier (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Sharma Wholesale"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Transport / Carrier</label>
              <input
                type="text"
                className="form-control"
                placeholder="VRL Logistics"
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Movement Date</label>
              <input
                type="text"
                className="form-control"
                placeholder="15 Aug 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari">
              {editingMovement ? 'Save Changes' : 'Add Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
