import React from 'react';
import { WebSupplier } from '../../types/suppliers';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteSupplierDialogProps {
  isOpen: boolean;
  supplier: WebSupplier | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteSupplierDialog: React.FC<DeleteSupplierDialogProps> = ({
  isOpen,
  supplier,
  userRole = 'ADMIN',
  onClose,
  onConfirm
}) => {
  if (!isOpen || !supplier) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Supplier: ${supplier.partyName}`}
      itemDetails={`ID: ${supplier.id}, Contact: ${supplier.contactPerson}, Phone: ${supplier.mobile}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
