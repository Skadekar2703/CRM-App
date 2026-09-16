import React from 'react';
import { WebExpense } from '../../types/expenses';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteExpenseDialogProps {
  isOpen: boolean;
  expense: WebExpense | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteExpenseDialog: React.FC<DeleteExpenseDialogProps> = ({
  isOpen,
  expense,
  userRole = 'ADMIN',
  onClose,
  onConfirm
}) => {
  if (!isOpen || !expense) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Expense: ${expense.category}`}
      itemDetails={`Amount: ₹${expense.amount} | Date: ${expense.date}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
