// frontend/src/components/ConfirmationModal.jsx
import React from 'react';
import Modal from './Modal'; // Наш базовый Modal
import Button from './Button'; // Наш кастомный Button

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Подтвердите действие", //
  message,
  confirmText = "Подтвердить", //
  cancelText = "Отмена", //
  confirmButtonVariant = "primary" // 'danger', 'primary', 'success'
}) {

  // Формируем JSX для футера модального окна
  const modalFooter = (
    <div className="flex justify-end space-x-3"> {/* Сохраняем выравнивание и отступы */}
      <Button
        variant="secondary"
        size="md" // Стандартный размер для кнопок в модалках
        onClick={onClose}
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmButtonVariant} // Используем variant из пропсов
        size="md"
        onClick={() => {
          onConfirm();
          // onClose(); // Закрытие модалки теперь может быть ответственностью вызывающего кода или Modal, если нужно
                       // Либо оставить здесь, если это стандартное поведение для ConfirmationModal
                       // В текущем Modal.jsx onClose вызывается по клику на X или оверлей.
                       // Для кнопок в футере, вызывающий код (или onConfirm) должен управлять закрытием.
                       // Я оставлю onClose() здесь, так как это логично для кнопки подтверждения в данном компоненте.
          onClose(); 
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
      footer={modalFooter} // <--- Передаем кнопки в новый проп footer
      maxWidth="max-w-md" // Можно задать стандартную ширину для confirmation модалок
    >
      {/* Основное сообщение остается как children для Modal */}
      <div className="mt-2"> {/* Оригинальный отступ для сообщения */}
        <p className="text-sm text-gray-600 whitespace-pre-wrap"> {/* */}
          {message}
        </p>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;