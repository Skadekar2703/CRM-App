import React from 'react';
import { Area } from '../../types/areas';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteAreaDialogProps {
  isOpen: boolean;
  area: Area | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAreaDialog: React.FC<DeleteAreaDialogProps> = ({
  isOpen,
  area,
  userRole = 'ADMIN',
  onClose,
  onConfirm
}) => {
  if (!isOpen || !area) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Area: ${area.name}`}
      itemDetails={`ID: ${area.id} | Status: ${area.status}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
