import React, { useState, useEffect } from 'react';
import { WebUser } from '../../types/users';
import { FormField, Input, Select } from '../common/form';

interface UserModalProps {
  isOpen: boolean;
  editingUser: WebUser | null;
  onClose: () => void;
  onSave: (username: string, role: 'ADMIN' | 'STAFF', password?: string) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, editingUser, onClose, onSave }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      const r = String(editingUser.role).toUpperCase();
      setRole(r === 'ADMIN' ? 'ADMIN' : 'STAFF');
      setPassword('');
    } else {
      setUsername('');
      setRole('STAFF');
      setPassword('');
    }
    setErrorMsg('');
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Username is required');
      return;
    }
    if (password.trim() && password.trim().length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (!editingUser && !password.trim()) {
      setErrorMsg('Password is required for new accounts');
      return;
    }

    onSave(username.trim().toLowerCase(), role, password.trim());
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2>{editingUser ? `Change Password / Edit "${editingUser.username}"` : 'Create Staff / User Account'}</h2>
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
          <FormField label="Username" required>
            <Input
              type="text"
              placeholder="e.g. staff01 or admin1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!!editingUser}
              required
            />
          </FormField>

          <FormField label="User Role" required>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}
              options={[
                { value: 'STAFF', label: 'STAFF' },
                { value: 'ADMIN', label: 'ADMIN' },
              ]}
            />
          </FormField>

          <FormField label={editingUser ? 'Set New Password (optional)' : 'Account Password'} required={!editingUser}>
            <Input
              type="password"
              placeholder={editingUser ? 'Leave blank to keep existing password' : 'Minimum 6 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: '#2563eb' }}>
              {editingUser ? 'Save Password / Role' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
