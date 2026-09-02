import React, { useState, useEffect } from 'react';
import { WebUser } from '../../types/users';

interface UserModalProps {
  isOpen: boolean;
  editingUser: WebUser | null;
  onClose: () => void;
  onSave: (username: string, email: string, role: 'Admin' | 'User', password?: string) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, editingUser, onClose, onSave }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'User'>('User');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      setEmail(editingUser.email);
      setRole(editingUser.role);
      setPassword('');
    } else {
      setUsername('');
      setEmail('');
      setRole('User');
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
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Valid Email address is required');
      return;
    }
    if (!editingUser && !password.trim()) {
      setErrorMsg('Password is required for new users');
      return;
    }

    onSave(username.trim(), email.trim(), role, password.trim());
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
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
            <label>Username / Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Shakir or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. sk@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>User Role *</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value as 'Admin' | 'User')}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {!editingUser && (
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingUser}
              />
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: '#2563eb' }}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
