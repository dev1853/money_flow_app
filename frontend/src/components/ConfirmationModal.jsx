// frontend/src/components/ConfirmationModal.jsx
import React from 'react';
import Modal from './Modal'; // Наш базовый Modal
import Button from './Button'; // Наш кастомный Button
import Alert from './Alert'; // <-- Импортируем компонент Alert

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Подтвердите действие", 
  message,
  confirmText = "Подтвердить", 
  cancelText = "Отмена", 
  confirmButtonVariant = "primary",
  errorAlertMessage // <-- НОВЫЙ ПРОПС для сообщения об ошибке
}) {

  const modalFooter = (
    <div className="flex justify-end space-x-3"> 
      <Button
        variant="secondary"
        size="md" 
        onClick={onClose} // onClose также очистит ошибку через AccountsPage
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmButtonVariant} 
        size="md"
        onClick={() => {
          onConfirm(); // onConfirm теперь будет отвечать за установку ошибки и решение о закрытии модального окна
          // onClose(); // Эту строку убираем, чтобы onConfirm мог контролировать закрытие
        }}
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      footer={modalFooter} 
      maxWidth="max-w-md" 
    >
      {/* <-- НОВОЕ: Отображаем Alert здесь, если есть сообщение об ошибке --> */}
      {errorAlertMessage && (
        <div className="mb-4"> {/* Добавляем отступ снизу */}
          <Alert type="error" message={errorAlertMessage} />
        </div>
      )}

      {/* Основное сообщение остается как children для Modal */}
      <div className="mt-2"> 
        <p className="text-sm text-gray-600 whitespace-pre-wrap"> 
          {message}
        </p>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;