import React, { useState } from 'react';
import { WebCustomer } from '../../types/customers';

interface CustomerDeleteModalProps {
  customer: WebCustomer;
  isOpen: boolean;
  userRole?: 'ADMIN' | 'STAFF';
  onClose: () => void;
  onConfirmDelete: (customer: WebCustomer) => Promise<void>;
}

export const CustomerDeleteModal: React.FC<CustomerDeleteModalProps> = ({
  customer,
  isOpen,
  userRole = 'ADMIN',
  onClose,
  onConfirmDelete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isStaff = userRole !== 'ADMIN';

  const handleNextStep = () => {
    if (isStaff) {
      setErrorMsg('Only Admin can delete customer details.');
      return;
    }
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleFinalDelete = async () => {
    if (isStaff) {
      setErrorMsg('Only Admin can delete customer details.');
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await onConfirmDelete(customer);
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('permission') || msg.includes('row-level security') || msg.includes('RLS')) {
        setErrorMsg('Only Admin can delete customer details.');
      } else {
        setErrorMsg('Unable to delete customer. Please ensure accounting records are safe.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px', backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#EF4444', fontSize: '18px', fontWeight: 800 }}>
            {step === 1 && '⚠️ Delete Customer? (Confirmation 1 of 3)'}
            {step === 2 && '🚨 Remove Record? (Confirmation 2 of 3)'}
            {step === 3 && '🛑 Final Permanent Delete (Confirmation 3 of 3)'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} type="button" style={{ color: '#94A3B8' }}>&times;</button>
        </div>

        {isStaff ? (
          <div style={{ color: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, borderLeft: '4px solid #EF4444' }}>
            🔒 Only Admin can delete customer details. Access Denied.
          </div>
        ) : (
          <>
            {errorMsg && (
              <div style={{ color: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 700, borderLeft: '4px solid #EF4444' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {step === 1 && (
              <div>
                <p style={{ color: '#CBD5E1', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                  Delete customer <strong>{customer.name}</strong> (ID: {customer.customerId})?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={onClose} type="button" style={{ padding: '9px 18px', backgroundColor: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                    Cancel
                  </button>
                  <button onClick={handleNextStep} type="button" style={{ padding: '9px 20px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>
                    Continue &rarr;
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #EF4444', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px' }}>
                  This will remove the customer from active CRM records. Continue?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={onClose} type="button" style={{ padding: '9px 18px', backgroundColor: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                    Cancel
                  </button>
                  <button onClick={handleNextStep} type="button" style={{ padding: '9px 20px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>
                    Confirm Stage 2 &rarr;
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>CUSTOMER DATA TO BE DELETED:</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>{customer.name}</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>ID: {customer.customerId} | Code: {customer.customerCode}</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>Mobile: {customer.mobile}</div>
                </div>

                <p style={{ color: '#EF4444', fontWeight: 800, fontSize: '14px', margin: '0 0 20px' }}>
                  Final confirmation: permanently delete this customer?
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={onClose} type="button" disabled={isDeleting} style={{ padding: '9px 18px', backgroundColor: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalDelete}
                    type="button"
                    disabled={isDeleting}
                    style={{ padding: '9px 20px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}
                  >
                    {isDeleting ? 'Deleting...' : 'DELETE PERMANENTLY'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
