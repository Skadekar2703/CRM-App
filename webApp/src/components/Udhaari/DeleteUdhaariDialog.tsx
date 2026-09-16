import React from 'react';
import { UdhaariCustomer } from '../../types/udhaari';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteUdhaariDialogProps {
  isOpen: boolean;
  customer: UdhaariCustomer | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteUdhaariDialog: React.FC<DeleteUdhaariDialogProps> = ({
  isOpen,
  customer,
  userRole = 'ADMIN',
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !customer) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Udhaari Record: ${customer.name}`}
      itemDetails={`UID: ${customer.uid} | Balance: ₹${customer.balance}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
