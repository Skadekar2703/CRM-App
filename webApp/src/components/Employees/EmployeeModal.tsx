import React, { useState, useEffect } from 'react';
import { WebEmployee } from '../../types/employees';

interface EmployeeModalProps {
  isOpen: boolean;
  editingEmployee: WebEmployee | null;
  onClose: () => void;
  onSave: (
    name: string,
    mobile: string,
    email: string,
    role: string,
    salary: number,
    ctcYtd: number,
    udhaarBalance: number,
    status: 'Active' | 'Inactive'
  ) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  editingEmployee,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('35000');
  const [ctcYtd, setCtcYtd] = useState('420000');
  const [udhaarBalance, setUdhaarBalance] = useState('0');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name);
      setMobile(editingEmployee.mobile);
      setEmail(editingEmployee.email);
      setRole(editingEmployee.role);
      setSalary(editingEmployee.salary ? editingEmployee.salary.toString() : '35000');
      setCtcYtd(editingEmployee.ctcYtd ? editingEmployee.ctcYtd.toString() : '420000');
      setUdhaarBalance(editingEmployee.udhaarBalance ? editingEmployee.udhaarBalance.toString() : '0');
      setStatus(editingEmployee.status || 'Active');
    } else {
      setName('');
      setMobile('');
      setEmail('');
      setRole('');
      setSalary('35000');
      setCtcYtd('420000');
      setUdhaarBalance('0');
      setStatus('Active');
    }
    setErrorMsg('');
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Employee Name is required');
      return;
    }

    const sal = parseFloat(salary) || 0;
    const ctc = parseFloat(ctcYtd) || sal * 12;
    const bal = parseFloat(udhaarBalance) || 0;

    onSave(
      name.trim(),
      mobile.trim(),
      email.trim(),
      role.trim() || 'Staff',
      sal,
      ctc,
      bal,
      status
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
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
            <label>Employee Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Role / Designation</label>
              <input
                type="text"
                className="form-control"
                placeholder="Senior Sales Exec"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Monthly Salary (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="45000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>CTC YTD (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="540000"
                value={ctcYtd}
                onChange={(e) => setCtcYtd(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Udhaar Balance (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={udhaarBalance}
                onChange={(e) => setUdhaarBalance(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="ramesh@crm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari">
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
