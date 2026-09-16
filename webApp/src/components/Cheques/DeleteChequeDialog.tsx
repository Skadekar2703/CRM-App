import React from 'react';
import { Cheque } from '../../types/cheques';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteChequeDialogProps {
  isOpen: boolean;
  cheque: Cheque | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteChequeDialog: React.FC<DeleteChequeDialogProps> = ({
  isOpen,
  cheque,
  userRole = 'ADMIN',
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !cheque) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Cheque: ${cheque.chequeNo}`}
      itemDetails={`Party: ${cheque.partyName} | Amount: ₹${cheque.amount}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
