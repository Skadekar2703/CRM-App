import React from 'react';
import { WebEmployee } from '../../types/employees';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteEmployeeDialogProps {
  isOpen: boolean;
  employee: WebEmployee | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteEmployeeDialog: React.FC<DeleteEmployeeDialogProps> = ({
  isOpen,
  employee,
  userRole = 'ADMIN',
  onClose,
  onConfirm
}) => {
  if (!isOpen || !employee) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Employee: ${employee.name}`}
      itemDetails={`Role: ${employee.role} | Mobile: ${employee.mobile}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
