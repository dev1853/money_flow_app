// frontend/src/components/ConfirmationModal.jsx
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import Alert from './Alert'; // Alert тоже нужно адаптировать

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, errorAlertMessage }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        {errorAlertMessage && (
          <div className="mt-4">
            <Alert type="error">{errorAlertMessage}</Alert>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="danger" onClick={onConfirm}>Подтвердить</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;