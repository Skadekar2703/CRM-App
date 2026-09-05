import React, { useState, useEffect, useRef } from 'react';
import { WebCustomer, CIBIL_OPTIONS } from '../../types/customers';
import { supabase } from '../../lib/supabase';
import { getSignedPhotoUrl } from '../../utils/photoUtils';
import { FormField, Input, Select, Textarea } from '../common/form';

// Validation helpers
const validateCustomerName = (name: string): string | null => {
  if (!name.trim()) return 'Customer full name is required.';
  return null;
};

const validateMobile = (mobile: string): string | null => {
  const trimmed = mobile.trim();
  if (!trimmed) return 'Mobile number is required.';
  if (!/^[0-9]{10}$/.test(trimmed)) return 'Mobile number must be exactly 10 numeric digits.';
  return null;
};

const validateCDCode = (code: string): string | null => {
  const trimmed = code.trim();
  if (!trimmed) return 'CD Code is required.';
  return null;
};

const validateGuarantorMobile = (mobile: string): string | null => {
  const trimmed = mobile.trim();
  if (trimmed && !/^[0-9]{10}$/.test(trimmed)) return 'Guarantor mobile number must be exactly 10 numeric digits.';
  return null;
};

interface CustomerModalProps {
  isOpen: boolean;
  editingCustomer: WebCustomer | null;
  availableAreas?: string[];
  userRole?: 'ADMIN' | 'STAFF';
  businessId?: string;
  onClose: () => void;
  onSave: (customerData: Partial<WebCustomer>) => Promise<void>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  editingCustomer,
  availableAreas: _availableAreas = [],
  userRole = 'ADMIN',
  businessId = '00000000-0000-0000-0000-000000000001',
  onClose,
  onSave
}) => {
  // SECTION 1: DETAILS
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [idCncNo, setIdCncNo] = useState('');
  const [cdCode, setCdCode] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // SECTION 2: CREDIT & GRADE
  const [cibilStatus, setCibilStatus] = useState<'Good' | 'Medium' | 'Low' | 'Bad'>('Good');
  const [cibilScore, setCibilScore] = useState<string>('750');
  const [category, setCategory] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [creditLimit, setCreditLimit] = useState<string>('50000');
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [taxNo, setTaxNo] = useState('');
  const [udharWapisiDin, setUdharWapisiDin] = useState<string>('30');

  // Load real customer categories from Supabase
  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setDbCategories(data);
        } else {
          setDbCategories([]);
        }
      });
  }, [isOpen]);

  // SECTION 3: ADDRESS
  const [area, setArea] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [dbAreas, setDbAreas] = useState<Array<{ id: string; name: string }>>([]);

  // Load real areas from Supabase
  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('areas')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setDbAreas(data);
        } else {
          setDbAreas([]);
        }
      });
  }, [isOpen]);

  // SECTION 4: GUARANTOR
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorMobile, setGuarantorMobile] = useState('');

  // SECTION 5: REMARK
  const [remark, setRemark] = useState('');

  // SECTION 6: STATUS
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [creditBlocked, setCreditBlocked] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (photoUrl) {
      getSignedPhotoUrl(photoUrl).then(url => setPreviewSignedUrl(url));
    } else {
      setPreviewSignedUrl(null);
    }
  }, [photoUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const cleanStr = (val?: string | null, fallback: string = ''): string => {
      if (!val) return fallback;
      const tr = val.trim();
      if (tr.toLowerCase() === 'null') return fallback;
      return tr;
    };

    if (editingCustomer) {
      setName(cleanStr(editingCustomer.name));
      setMobile(cleanStr(editingCustomer.mobile));
      setAlternateMobile(cleanStr(editingCustomer.alternateMobile));
      setEmail(cleanStr(editingCustomer.email));
      setIdCncNo(cleanStr(editingCustomer.idCncNo));
      setCdCode(cleanStr(editingCustomer.customerCode));
      setCustomerId(cleanStr(editingCustomer.customerId));
      setPhotoUrl(cleanStr(editingCustomer.photoUrl));

      setCibilStatus((cleanStr(editingCustomer.cibilStatus, 'Good') as any) || 'Good');
      setCibilScore(String(editingCustomer.cibilScore || 750));
      setCategory(cleanStr(editingCustomer.category));
      setCategoryId(editingCustomer.categoryId || null);
      setCreditLimit(String(editingCustomer.creditLimit ?? 50000));
      setOpeningBalance(String(editingCustomer.openingBalance ?? 0));
      setTaxNo(cleanStr(editingCustomer.taxNo));
      setUdharWapisiDin(String(editingCustomer.udharWapisiDin ?? 30));

      setAddress(cleanStr(editingCustomer.address));
      const initAreaName = cleanStr(editingCustomer.area);
      setArea(initAreaName);
      const matchedAreaObj = dbAreas.find(a => a.name.trim().toLowerCase() === initAreaName.trim().toLowerCase());
      setAreaId(editingCustomer.areaId || matchedAreaObj?.id || null);
      setRemark(cleanStr(editingCustomer.remark));
      setGuarantorName(cleanStr(editingCustomer.guarantorName));
      setGuarantorMobile(cleanStr(editingCustomer.guarantorMobile));

      setStatus(editingCustomer.status || 'Active');
      setCreditBlocked(Boolean(editingCustomer.creditBlocked));
    } else {
      setName('');
      setMobile('');
      setAlternateMobile('');
      setEmail('');
      setIdCncNo('');
      setPhotoUrl('');

      setCibilStatus('Good');
      setCibilScore('750');
      setCategory('');
      setCategoryId(null);
      setCreditLimit('50000');
      setOpeningBalance('0');
      setTaxNo('');
      setUdharWapisiDin('30');

      setAddress('');
      setArea(dbAreas.length > 0 ? dbAreas[0].name : '');
      setAreaId(dbAreas.length > 0 ? dbAreas[0].id : null);
      setRemark('');
      setGuarantorName('');
      setGuarantorMobile('');

      setStatus('Active');
      setCreditBlocked(false);

      setCustomerId('Auto-Generated');
      setCdCode('Auto-Generated');
    }
    setErrorMsg('');
  }, [editingCustomer, isOpen, businessId]);

  if (!isOpen) return null;

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5 MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMsg('');

      const rawExt = file.name.split('.').pop() || 'jpg';
      const fileExt = rawExt.toLowerCase() === 'jpeg' ? 'jpg' : rawExt.toLowerCase();
      const fileName = `customer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${businessId}/photos/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('customer_photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) {
        setErrorMsg(`Photo upload failed: ${uploadErr.message}`);
        return;
      }

      setPhotoUrl(filePath);
    } catch (err: any) {
      setErrorMsg(`Photo upload failed: ${err?.message || 'Error'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (editingCustomer && userRole !== 'ADMIN') {
      setErrorMsg('Only Admin can edit customer details.');
      return;
    }

    const nameErr = validateCustomerName(name);
    if (nameErr) { setErrorMsg(nameErr); return; }

    const mobileErr = validateMobile(mobile);
    if (mobileErr) { setErrorMsg(mobileErr); return; }

    if (!category || !category.trim() || category === 'Select Category') {
      setErrorMsg('Please select a customer category.');
      return;
    }

    const codeErr = validateCDCode(cdCode);
    if (codeErr) { setErrorMsg(codeErr); return; }

    const guarantorErr = validateGuarantorMobile(guarantorMobile);
    if (guarantorErr) { setErrorMsg(guarantorErr); return; }

    const limitNum = parseFloat(creditLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      setErrorMsg('Credit limit must be a valid non-negative number.');
      return;
    }

    const selectedCatObj = dbCategories.find(c => c.name === category || c.id === category);
    const finalCatName = selectedCatObj?.name || category.trim();
    const finalCatId = selectedCatObj?.id || categoryId || null;

    const selectedAreaObj = dbAreas.find(a => a.name === area || a.id === area);
    const finalAreaName = selectedAreaObj?.name || area.trim();
    const finalAreaId = selectedAreaObj?.id || areaId || null;

    setIsSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        mobile: mobile.trim(),
        alternateMobile: alternateMobile.trim(),
        email: email.trim(),
        idCncNo: idCncNo.trim(),
        customerCode: cdCode.trim(),
        customerId: customerId.trim(),
        photoUrl: photoUrl.trim() || null,

        cibilStatus,
        cibilScore: parseInt(cibilScore) || 750,
        category: finalCatName,
        categoryId: finalCatId,
        creditLimit: limitNum,
        openingBalance: parseFloat(openingBalance) || 0,
        taxNo: taxNo.trim(),
        udharWapisiDin: parseInt(udharWapisiDin) || 30,

        address: address.trim(),
        area: finalAreaName,
        areaId: finalAreaId,
        remark: remark.trim(),
        guarantorName: guarantorName.trim(),
        guarantorMobile: guarantorMobile.trim(),

        status,
        creditBlocked
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('idx_customers_business_phone') || msg.includes('phone')) {
        setErrorMsg('A customer with this mobile number already exists.');
      } else if (msg.includes('idx_customers_business_customer_code') || msg.includes('customer_code')) {
        setErrorMsg('This CD Code is already in use.');
      } else {
        setErrorMsg(msg || 'Failed to save customer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '780px', borderRadius: '16px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 24px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
            {editingCustomer ? `Edit Customer (${customerId})` : 'Add New Customer'}
          </h2>
          <button className="modal-close-btn" onClick={onClose} type="button" style={{ color: 'var(--text-muted)' }}>&times;</button>
        </div>

        {errorMsg && (
          <div style={{ color: '#F87171', fontSize: '13px', fontWeight: 700, padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid #EF4444', margin: '16px 24px 0', borderRadius: '8px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {editingCustomer && userRole !== 'ADMIN' && (
          <div style={{ color: '#FBBF24', fontSize: '13px', fontWeight: 700, padding: '12px 16px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderLeft: '4px solid #F59E0B', margin: '16px 24px 0', borderRadius: '8px' }}>
            🔒 Only Admin can edit customer details. Form fields are read-only.
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* SECTION 1 — CUSTOMER DETAILS */}
          <div style={{ marginBottom: '24px', backgroundColor: '#0F172A', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              SECTION 1 — CUSTOMER DETAILS
            </h3>

            {/* Photo picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
              {previewSignedUrl ? (
                <img src={previewSignedUrl} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38BDF8' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#334155', color: '#94A3B8', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  {name ? name.substring(0, 2).toUpperCase() : '👤'}
                </div>
              )}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: '6px' }}>Customer Photo</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFileChange} disabled={editingCustomer ? userRole !== 'ADMIN' : false} />
                  <button type="button" className="btn-secondary-udhaari" disabled={isUploadingPhoto || (editingCustomer ? userRole !== 'ADMIN' : false)} onClick={() => fileInputRef.current?.click()} style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    {isUploadingPhoto ? 'Uploading...' : photoUrl ? 'Replace Photo' : 'Add Photo'}
                  </button>
                  {photoUrl && userRole === 'ADMIN' && (
                    <button type="button" onClick={() => setPhotoUrl('')} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="UID (Auto-Generated 6-Digit)">
                <Input type="text" value={customerId} readOnly disabled style={{ backgroundColor: '#1E293B', fontWeight: 800, color: '#38BDF8', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Full Name" required>
                <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} required style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Mobile Number (10 Digits)" required>
                <Input type="text" placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} disabled={editingCustomer ? userRole !== 'ADMIN' : false} required style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Alternate Mobile">
                <Input type="text" placeholder="Optional 10 Digits" value={alternateMobile} onChange={(e) => setAlternateMobile(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Email">
                <Input type="email" placeholder="customer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="ID / CNC Number">
                <Input type="text" placeholder="National ID / CNC No" value={idCncNo} onChange={(e) => setIdCncNo(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="CD Code" required>
                <Input type="text" placeholder="e.g. cd08, ABC123, 12345" value={cdCode} onChange={(e) => setCdCode(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} required style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>
            </div>
          </div>

          {/* SECTION 2 — CREDIT & GRADE */}
          <div style={{ marginBottom: '24px', backgroundColor: '#0F172A', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              SECTION 2 — CREDIT & GRADE
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="CIBIL Status">
                <Select value={cibilStatus} onChange={(e) => setCibilStatus(e.target.value as any)} options={CIBIL_OPTIONS.map(o => ({ value: o, label: o }))} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Category *" required>
                <Select
                  value={category}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setCategory(sel);
                    const found = dbCategories.find(c => c.name === sel);
                    setCategoryId(found?.id || null);
                  }}
                  options={[
                    { value: '', label: '-- Select Category --' },
                    ...dbCategories.map(c => ({ value: c.name, label: c.name }))
                  ]}
                  disabled={editingCustomer ? userRole !== 'ADMIN' : false}
                  required
                  style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}
                />
              </FormField>

              <FormField label="Credit Limit (₹)" required helperText="Max allowed Baki balance">
                <Input type="number" placeholder="50000" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} required style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', fontWeight: 800 }} />
              </FormField>

              <FormField label="Opening Balance (₹)">
                <Input type="number" placeholder="0" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Tax Number (GST/VAT)">
                <Input type="text" placeholder="GSTIN / Tax No" value={taxNo} onChange={(e) => setTaxNo(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Udhaari Wapisi Din (Credit Return Days)">
                <Input type="number" placeholder="30" value={udharWapisiDin} onChange={(e) => setUdharWapisiDin(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>
            </div>
          </div>

          {/* SECTION 3 — ADDRESS */}
          <div style={{ marginBottom: '24px', backgroundColor: '#0F172A', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              SECTION 3 — ADDRESS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <FormField label="Area / Location *" required>
                {dbAreas.length > 0 ? (
                  <Select
                    value={area}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setArea(sel);
                      const found = dbAreas.find(a => a.name === sel);
                      setAreaId(found?.id || null);
                    }}
                    options={[
                      { value: '', label: '-- Select Area --' },
                      ...dbAreas.map(a => ({ value: a.name, label: a.name }))
                    ]}
                    disabled={editingCustomer ? userRole !== 'ADMIN' : false}
                    required
                    style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                    <span style={{ color: '#94A3B8', fontSize: '13px' }}>No areas available.</span>
                    {userRole === 'ADMIN' && (
                      <button
                        type="button"
                        style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => {
                          window.location.hash = 'areas';
                          onClose();
                        }}
                      >
                        + Add Area
                      </button>
                    )}
                  </div>
                )}
              </FormField>

              <FormField label="Full Address">
                <Textarea rows={2} placeholder="Complete physical address..." value={address} onChange={(e) => setAddress(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>
            </div>
          </div>

          {/* SECTION 4 — GUARANTOR */}
          <div style={{ marginBottom: '24px', backgroundColor: '#0F172A', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              SECTION 4 — GUARANTOR DETAILS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Guarantor Name">
                <Input type="text" placeholder="Guarantor full name" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>

              <FormField label="Guarantor Mobile Number">
                <Input type="text" placeholder="9876543210" value={guarantorMobile} onChange={(e) => setGuarantorMobile(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
              </FormField>
            </div>
          </div>

          {/* SECTION 5 — REMARK */}
          <div style={{ marginBottom: '24px', backgroundColor: '#0F172A', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              SECTION 5 — REMARK / DESCRIPTION
            </h3>

            <FormField label="Remark">
              <Textarea rows={2} placeholder="Internal account remarks..." value={remark} onChange={(e) => setRemark(e.target.value)} disabled={editingCustomer ? userRole !== 'ADMIN' : false} style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }} />
            </FormField>
          </div>

          {/* SECTION 6 — STATUS & CONTROLS */}
          <div style={{ marginBottom: '24px', backgroundColor: '#0F172A', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              SECTION 6 — STATUS & CONTROLS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Account Status</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{status === 'Active' ? 'Active in CRM' : 'Inactive account'}</div>
                </div>
                <button
                  type="button"
                  disabled={editingCustomer ? userRole !== 'ADMIN' : false}
                  onClick={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: 'none',
                    cursor: (editingCustomer && userRole !== 'ADMIN') ? 'not-allowed' : 'pointer',
                    backgroundColor: status === 'Active' ? '#22C55E' : '#64748B',
                    color: '#FFFFFF'
                  }}
                >
                  {status}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Credit Blocked</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{creditBlocked ? 'New Baki Rejected' : 'New Baki Allowed'}</div>
                </div>
                <button
                  type="button"
                  disabled={editingCustomer ? userRole !== 'ADMIN' : false}
                  onClick={() => setCreditBlocked(!creditBlocked)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: 'none',
                    cursor: (editingCustomer && userRole !== 'ADMIN') ? 'not-allowed' : 'pointer',
                    backgroundColor: creditBlocked ? '#EF4444' : '#334155',
                    color: '#FFFFFF'
                  }}
                >
                  {creditBlocked ? 'BLOCKED ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose} disabled={isSubmitting} style={{ backgroundColor: '#334155', color: '#F8FAFC', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
              Cancel
            </button>
            {(userRole === 'ADMIN' || !editingCustomer) && (
              <button type="submit" className="btn-primary-udhaari" style={{ backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
