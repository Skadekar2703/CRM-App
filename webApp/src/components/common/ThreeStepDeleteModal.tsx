import React, { useState, useEffect } from 'react';

interface ThreeStepDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  itemDetails?: string;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
}

export const ThreeStepDeleteModal: React.FC<ThreeStepDeleteModalProps> = ({
  isOpen,
  itemName,
  itemDetails,
  userRole = 'ADMIN',
  onClose,
  onConfirmDelete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsDeleting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isStaff = String(userRole).toUpperCase() !== 'ADMIN';

  const handleNextStep = () => {
    if (isStaff) {
      setErrorMsg('Only Admin users can perform delete actions.');
      return;
    }
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleFinalDelete = async () => {
    if (isStaff) {
      setErrorMsg('Only Admin users can perform delete actions.');
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await onConfirmDelete();
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('permission') || msg.includes('row-level security') || msg.includes('RLS')) {
        setErrorMsg('Only Admin users can delete records.');
      } else {
        setErrorMsg(msg || 'Unable to delete item. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          borderRadius: '16px',
          padding: '24px',
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          border: '1px solid #334155',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#EF4444', fontSize: '18px', fontWeight: 800 }}>
            {step === 1 && `⚠️ Delete ${itemName}? (Confirmation 1 of 3)`}
            {step === 2 && `⚠️ Confirm Delete (Confirmation 2 of 3)`}
            {step === 3 && `⚠️ Final Confirmation (Confirmation 3 of 3)`}
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            type="button"
            style={{ color: '#94A3B8', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {isStaff ? (
          <div style={{ color: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, borderLeft: '4px solid #EF4444' }}>
            🔒 Only Admin users can delete records. Access Denied.
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
                  Are you sure you want to delete <strong>{itemName}</strong>?
                  {itemDetails && <span style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{itemDetails}</span>}
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
                  This action will remove <strong>{itemName}</strong>. Please confirm that you want to continue.
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

            {step === 3 && (
              <div>
                <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 800, textTransform: 'uppercase' }}>ITEM TO BE DELETED:</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>{itemName}</div>
                  {itemDetails && <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>{itemDetails}</div>}
                </div>

                <p style={{ color: '#EF4444', fontWeight: 800, fontSize: '14px', margin: '0 0 20px' }}>
                  This action cannot be undone. Are you sure you want to permanently delete <strong>{itemName}</strong>?
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
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
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
