import React, { useState, useEffect } from 'react';
import { WebEmployee } from '../../types/employees';
import { supabase } from '../../lib/supabase';

interface EmployeeModalProps {
  isOpen: boolean;
  editingEmployee: WebEmployee | null;
  onClose: () => void;
  onSave: (employeeData: Partial<WebEmployee>) => Promise<void> | void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  editingEmployee,
  onClose,
  onSave
}) => {
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [salaryType, setSalaryType] = useState<'Monthly' | 'Per Day'>('Monthly');
  const [salary, setSalary] = useState<number | ''>(25000);
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [joinedOn, setJoinedOn] = useState(new Date().toISOString().split('T')[0]);
  const [leftOn, setLeftOn] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [remark, setRemark] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingEmployee) {
      setUid(editingEmployee.uid || '');
      setName(editingEmployee.name || '');
      setMobile(editingEmployee.mobile || '');
      setEmail(editingEmployee.email || '');
      setRole(editingEmployee.role || 'Staff');
      setSalaryType(editingEmployee.salaryType || 'Monthly');
      setSalary(editingEmployee.salary ?? 25000);
      setAddress(editingEmployee.address || '');
      setBankName(editingEmployee.bankName || '');
      setBankAccount(editingEmployee.bankAccount || '');
      setIdNumber(editingEmployee.idNumber || '');
      setEmergencyContact(editingEmployee.emergencyContact || '');
      setJoinedOn(editingEmployee.joinedOn ? editingEmployee.joinedOn.split('T')[0] : new Date().toISOString().split('T')[0]);
      setLeftOn(editingEmployee.leftOn ? editingEmployee.leftOn.split('T')[0] : '');
      setPhotoUrl(editingEmployee.photoUrl || '');
      setRemark(editingEmployee.remark || '');
      setStatus(editingEmployee.status || 'Active');
    } else {
      setUid('');
      setName('');
      setMobile('');
      setEmail('');
      setRole('Staff');
      setSalaryType('Monthly');
      setSalary(25000);
      setAddress('');
      setBankName('');
      setBankAccount('');
      setIdNumber('');
      setEmergencyContact('');
      setJoinedOn(new Date().toISOString().split('T')[0]);
      setLeftOn('');
      setPhotoUrl('');
      setRemark('');
      setStatus('Active');
    }
    setErrorMsg('');
    setIsSaving(false);
    setPhotoUploading(false);
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      // Try uploading to Supabase Storage bucket first
      const fileExt = file.name.split('.').pop();
      const fileName = `emp_${Date.now()}.${fileExt}`;
      const filePath = `employees/${fileName}`;

      const { data, error } = await supabase.storage
        .from('employee_photos')
        .upload(filePath, file);

      if (!error && data) {
        const { data: pubData } = supabase.storage
          .from('employee_photos')
          .getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          setPhotoUrl(pubData.publicUrl);
          setPhotoUploading(false);
          return;
        }
      }

      // FileReader + Canvas Compression fallback (prevents huge base64 payloads)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
            setPhotoUrl(compressedUrl);
          } else {
            setPhotoUrl(event.target?.result as string || '');
          }
          setPhotoUploading(false);
        };
        img.onerror = () => {
          setPhotoUrl(event.target?.result as string || '');
          setPhotoUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => setPhotoUploading(false);
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Photo processing warning:', err);
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile Number is required');
      return;
    }
    if (photoUploading) {
      setErrorMsg('Photo is still processing. Please wait a moment...');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSave({
        uid: uid.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        role: role.trim() || 'Staff',
        salaryType,
        salary: Number(salary) || 0,
        address: address.trim(),
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        idNumber: idNumber.trim(),
        emergencyContact: emergencyContact.trim(),
        joinedOn,
        leftOn: leftOn || undefined,
        photoUrl: photoUrl.trim(),
        remark: remark.trim(),
        status
      });
      onClose();
    } catch (err: any) {
      console.error('Modal handleSubmit error:', err);
      setErrorMsg(err?.message || 'Failed to save employee. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '660px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'}</h3>
          <button className="modal-close-btn" onClick={onClose} disabled={isSaving}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #fecaca', marginBottom: '12px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* PHOTO THUMBNAIL & FILE UPLOAD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', backgroundColor: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
              {photoUrl ? (
                <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                name ? name.charAt(0).toUpperCase() : '📷'
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Employee Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                disabled={photoUploading || isSaving}
                style={{ fontSize: '12px' }}
              />
              {photoUploading && <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, marginLeft: '8px' }}>Processing image...</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ravi Kumar"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errorMsg) setErrorMsg(''); }}
                disabled={isSaving}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={mobile}
                onChange={(e) => { setMobile(e.target.value); if (errorMsg) setErrorMsg(''); }}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role / Designation</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)} disabled={isSaving}>
                <option value="Helper">Helper</option>
                <option value="Labour">Labour</option>
                <option value="Driver">Driver</option>
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Operator">Operator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')} disabled={isSaving}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Salary Type</label>
              <select className="form-input" value={salaryType} onChange={(e) => setSalaryType(e.target.value as 'Monthly' | 'Per Day')} disabled={isSaving}>
                <option value="Monthly">Monthly</option>
                <option value="Per Day">Per Day</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Salary / Rate (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder={salaryType === 'Monthly' ? '25000' : '850'}
                value={salary}
                onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Joined On *</label>
              <input
                type="date"
                className="form-input"
                value={joinedOn}
                onChange={(e) => setJoinedOn(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Left On (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={leftOn}
                onChange={(e) => setLeftOn(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Account / IBAN</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 5010023456789"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ID / CNIC / Identity No</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AADH-9876-1234"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91 98111 22233"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. House #45, Industrial Area, Sector 5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remark / Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Skilled machine operator, shifts day/night"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary-web" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-item" disabled={isSaving || photoUploading}>
              {isSaving ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

