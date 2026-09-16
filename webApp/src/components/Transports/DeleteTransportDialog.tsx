import React from 'react';
import { Transport } from '../../types/transports';
import { ThreeStepDeleteModal } from '../common/ThreeStepDeleteModal';

interface DeleteTransportDialogProps {
  isOpen: boolean;
  transport: Transport | null;
  userRole?: 'ADMIN' | 'STAFF' | string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteTransportDialog: React.FC<DeleteTransportDialogProps> = ({
  isOpen,
  transport,
  userRole = 'ADMIN',
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !transport) return null;

  return (
    <ThreeStepDeleteModal
      isOpen={isOpen}
      itemName={`Transport: ${transport.transportName}`}
      itemDetails={`Phone: ${transport.mobile || 'N/A'}, Vehicle: ${transport.vehicleNumber || 'N/A'}`}
      userRole={userRole}
      onClose={onClose}
      onConfirmDelete={onConfirm}
    />
  );
};
