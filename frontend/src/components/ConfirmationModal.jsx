// src/components/ConfirmationModal.jsx
import React from 'react';
import Modal from './Modal'; // Мы будем использовать наш ранее созданный Modal

function ConfirmationModal({
  isOpen,
  onClose, // Функция для закрытия модального окна (например, при нажатии "Отмена")
  onConfirm, // Функция, которая выполнится при подтверждении
  title = "Подтвердите действие",
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  confirmButtonVariant = "danger" // 'danger', 'primary', 'success'
}) {
  let confirmButtonClass = "bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-600"; // primary по умолчанию
  if (confirmButtonVariant === "danger") {
    confirmButtonClass = "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600";
  } else if (confirmButtonVariant === "success") {
    confirmButtonClass = "bg-green-600 hover:bg-green-700 focus-visible:outline-green-600";
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mt-2">
        <p className="text-sm text-gray-600 whitespace-pre-wrap"> {/* whitespace-pre-wrap для переноса строк в message */}
          {message}
        </p>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass}`}
          onClick={() => {
            onConfirm();
            onClose(); // Автоматически закрываем модалку после подтверждения
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;