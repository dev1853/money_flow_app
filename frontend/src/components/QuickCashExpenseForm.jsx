// frontend/src/components/QuickCashExpenseForm.jsx
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import TransactionForm from './TransactionForm';
import Alert from './Alert';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

function QuickCashExpenseForm() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { activeWorkspace } = useAuth();

  const handleOpenModal = () => {
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleQuickExpenseSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (!activeWorkspace) {
        throw new Error("Рабочее пространство не выбрано.");
      }
      const response = await apiService.post('/transactions/', formData); // Сохраняем ответ, чтобы его можно было посмотреть
      
      setSuccessMessage("Расход успешно добавлен!");
      handleCloseModal();
      
    } catch (err) {
      setErrorMessage(err.message || "Не удалось добавить расход.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpenModal}>Быстрый расход наличными</Button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Быстрый расход наличными">
        {successMessage && <Alert type="success" className="mb-4">{successMessage}</Alert>}
        {errorMessage && <Alert type="error" className="mb-4">{errorMessage}</Alert>}
        
        <TransactionForm
          onSubmit={handleQuickExpenseSubmit}
          onCancel={handleCloseModal}
          loading={loading}
          isQuickCashExpense={true}
        />
      </Modal>
    </>
  );
}

export default QuickCashExpenseForm;