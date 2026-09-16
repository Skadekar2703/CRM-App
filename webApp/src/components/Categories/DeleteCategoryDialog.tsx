import React from 'react';
import { Category } from '../../types/categories';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  isOpen,
  category,
  userRole = 'ADMIN',
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !category) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Category: ${category.name}`}
      itemDetails={`Type: ${category.type || 'Customer Category'}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
