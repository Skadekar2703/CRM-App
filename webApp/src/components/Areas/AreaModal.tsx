import React, { useState, useEffect } from 'react';
import { Area } from '../../types/areas';
import './Areas.css';

interface AreaModalProps {
  isOpen: boolean;
  editingArea: Area | null;
  onClose: () => void;
  onSave: (name: string, status: 'Active' | 'Inactive') => void;
}

export const AreaModal: React.FC<AreaModalProps> = ({ isOpen, editingArea, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingArea) {
      setName(editingArea.name);
      setStatus(editingArea.status);
    } else {
      setName('');
      setStatus('Active');
    }
    setError(null);
  }, [editingArea, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Area Name is required.');
      return;
    }

    onSave(name.trim(), status);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {editingArea ? 'Edit Area' : 'Add New Area'}
          </h3>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Area Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="pos-search-input"
              style={{ padding: '10px 14px' }}
              placeholder="e.g. North Region Hub"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Status</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                />
                <span className="status-pill active">Active</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={status === 'Inactive'}
                  onChange={() => setStatus('Inactive')}
                />
                <span className="status-pill inactive">Inactive</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingArea ? 'Save Changes' : 'Add Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
