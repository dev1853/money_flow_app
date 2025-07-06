// frontend/src/components/QuickCashExpenseForm.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import Modal from './Modal';
import Button from './Button';
import TransactionForm from './TransactionForm';
import Alert from './Alert';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

function QuickCashExpenseForm() {
  console.log("DEBUG(QuickExpense): Component Rendered.");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Получаем accounts и ddsArticles из AuthContext ***
  const { activeWorkspace, current_user, accounts, ddsArticles, fetchDataForWorkspace } = useAuth(); 

  useEffect(() => {
    console.log("DEBUG(QuickExpense): useEffect mounted/updated. activeWorkspace:", activeWorkspace);
    return () => console.log("DEBUG(QuickExpense): useEffect cleanup.");
  }, [activeWorkspace]);


  const handleOpenModal = useCallback(() => {
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(true);
    console.log("DEBUG(QuickExpense): Modal opened. showModal:", true);
  }, []); 

  const handleCloseModal = useCallback(() => {
    console.log("DEBUG(QuickExpense): handleCloseModal called. showModal before:", showModal);
    setShowModal(false);
    setSuccessMessage('');
    setErrorMessage('');
    console.log("DEBUG(QuickExpense): Modal closed. showModal after:", false);
  }, [showModal]); 

  const handleQuickExpenseSubmit = useCallback(async (formData) => {
    console.log("DEBUG(QuickExpense): handleQuickExpenseSubmit invoked!");
    console.log("DEBUG(QuickExpense): Input formData:", JSON.stringify(formData));
    console.log("DEBUG(QuickExpense): activeWorkspace during submit:", activeWorkspace);
    console.log("DEBUG(QuickExpense): current_user during submit:", current_user);

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (!activeWorkspace || !activeWorkspace.id) {
        console.error("DEBUG(QuickExpense): activeWorkspace is null or invalid during submit!");
        throw new Error("Рабочее пространство не выбрано или неактивно.");
      }
      console.log("DEBUG(QuickExpense): activeWorkspace is valid. Sending API POST request to /transactions/...");
      // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем apiService.createTransaction и обновляем балансы/данные ***
      const response = await apiService.createTransaction(formData); 
      console.log("DEBUG(QuickExpense): API POST request completed. Response:", JSON.stringify(response));
      
      setSuccessMessage("Расход успешно добавлен!");
      console.log("DEBUG(QuickExpense): Transaction submitted successfully. Preparing to close modal.");
      handleCloseModal();

      // Также обновим балансы и список транзакций после успешного добавления
      if (activeWorkspace) {
        fetchDataForWorkspace(activeWorkspace.id); // Обновляем балансы и данные воркспейса
      }
      
    } catch (err) {
      setErrorMessage(err.message || "Не удалось добавить расход.");
      console.error("DEBUG(QuickExpense): Error submitting transaction:", err);
    } finally {
      setLoading(false);
      console.log("DEBUG(QuickExpense): handleQuickExpenseSubmit finished. Loading state set to false.");
    }
  }, [activeWorkspace, current_user, handleCloseModal, fetchDataForWorkspace]); // Добавляем fetchDataForWorkspace в зависимости


  const debugInfo = `
    Type of handleQuickExpenseSubmit: ${typeof handleQuickExpenseSubmit} | 
    activeWorkspace ID: ${activeWorkspace ? activeWorkspace.id : 'null'} |
    current_user username: ${current_user ? current_user.username : 'null'} |
    showModal state: ${showModal} |
    loading state: ${loading}
  `;

  return (
    <>
      <Button onClick={handleOpenModal}>Быстрый расход наличными</Button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Быстрый расход наличными">
        {successMessage && <Alert type="success" className="mb-4">{successMessage}</Alert>}
        {errorMessage && <Alert type="error" className="mb-4">{errorMessage}</Alert>}
        
        <TransactionForm
          onSubmit={handleQuickExpenseSubmit}
          onCancel={handleCloseModal}
          // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Передаем accounts и articles в TransactionForm ***
          accounts={accounts || []}
          articles={ddsArticles || []}
          defaultType="EXPENSE" // Явно устанавливаем тип по умолчанию для QuickCashExpenseForm
          loading={loading} // Пропс loading не используется в TransactionForm, т.к. он уже есть в isSubmitting
          isSubmitting={loading} // используем 'loading' как 'isSubmitting'
          // isQuickCashExpense={true} // Этот пропс можно оставить или удалить, если не используется в TransactionForm
        />
      </Modal>
    </>
  );
}

export default memo(QuickCashExpenseForm);