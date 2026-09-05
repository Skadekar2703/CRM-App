import React, { useState } from 'react';

export interface TransactionItemForDelete {
  id: string;
  customerName: string;
  type: string;
  amount: number;
  date: string;
}

interface TransactionDeleteModalProps {
  transaction: TransactionItemForDelete;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (transaction: TransactionItemForDelete) => Promise<void>;
}

export const TransactionDeleteModal: React.FC<TransactionDeleteModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleFinalDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await onConfirmDelete(transaction);
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('permission') || msg.includes('row-level security') || msg.includes('RLS')) {
        setErrorMsg('You do not have permission to delete this record. Only an Admin can delete CRM data.');
      } else {
        setErrorMsg('Unable to delete this record. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#DC2626', fontSize: '18px', fontWeight: 700 }}>
            {step === 1 && '⚠️ Delete Transaction (Stage 1 of 3)'}
            {step === 2 && '🚨 Balance Effect Warning (Stage 2 of 3)'}
            {step === 3 && '🛑 FINAL CONFIRMATION (Stage 3 of 3)'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} type="button">&times;</button>
        </div>

        {errorMsg && (
          <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5', margin: '0 0 20px' }}>
              Are you sure you want to delete this transaction for <strong>{transaction.customerName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-btn" onClick={onClose} type="button">Cancel</button>
              <button className="primary-btn" onClick={handleNextStep} type="button" style={{ backgroundColor: '#DC2626' }}>Continue &rarr;</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: '#991B1B', backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #DC2626', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px' }}>
              This transaction affects the customer's financial balance. Once deleted, it cannot be recovered.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-btn" onClick={onClose} type="button">Cancel</button>
              <button className="primary-btn" onClick={handleNextStep} type="button" style={{ backgroundColor: '#DC2626' }}>I Understand, Continue &rarr;</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>TRANSACTION DETAILS:</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{transaction.customerName}</div>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>Type: {transaction.type} | Amount: ₹{transaction.amount.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>Date: {transaction.date}</div>
            </div>

            <p style={{ color: '#DC2626', fontWeight: 700, fontSize: '14px', margin: '0 0 20px' }}>
              Delete this transaction permanently?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-btn" onClick={onClose} type="button" disabled={isDeleting}>Cancel</button>
              <button
                className="primary-btn"
                onClick={handleFinalDelete}
                type="button"
                disabled={isDeleting}
                style={{ backgroundColor: '#DC2626', opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? 'Deleting...' : 'DELETE PERMANENTLY'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
