// frontend/src/components/QuickCashExpenseForm.jsx
import React, { useState, useEffect, useCallback, memo } from 'react'; // <--- ДОБАВЛЕН memo
import Modal from './Modal';
import Button from './Button';
import TransactionForm from './TransactionForm';
import Alert from './Alert';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

function QuickCashExpenseForm() {
  console.log("DEBUG(QuickExpense): Component Rendered.");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { activeWorkspace, current_user } = useAuth(); 

  useEffect(() => {
    console.log("DEBUG(QuickExpense): useEffect mounted/updated. activeWorkspace:", activeWorkspace);
    return () => console.log("DEBUG(QuickExpense): useEffect cleanup.");
  }, [activeWorkspace]);


  const handleOpenModal = useCallback(() => { // Оборачиваем в useCallback
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(true);
    console.log("DEBUG(QuickExpense): Modal opened. showModal:", true);
  }, []); // Пустой массив зависимостей, т.к. не использует внешние переменные

  const handleCloseModal = useCallback(() => { // Оборачиваем в useCallback
    console.log("DEBUG(QuickExpense): handleCloseModal called. showModal before:", showModal);
    setShowModal(false);
    setSuccessMessage('');
    setErrorMessage('');
    console.log("DEBUG(QuickExpense): Modal closed. showModal after:", false);
  }, [showModal]); // Зависит от showModal

  const handleQuickExpenseSubmit = useCallback(async (formData) => { // Оборачиваем в useCallback
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
      const response = await apiService.post('/transactions/', formData); 
      console.log("DEBUG(QuickExpense): API POST request completed. Response:", JSON.stringify(response));
      
      setSuccessMessage("Расход успешно добавлен!");
      console.log("DEBUG(QuickExpense): Transaction submitted successfully. Preparing to close modal.");
      handleCloseModal();
      
    } catch (err) {
      setErrorMessage(err.message || "Не удалось добавить расход.");
      console.error("DEBUG(QuickExpense): Error submitting transaction:", err);
    } finally {
      setLoading(false);
      console.log("DEBUG(QuickExpense): handleQuickExpenseSubmit finished. Loading state set to false.");
    }
  }, [activeWorkspace, current_user, handleCloseModal]); // Зависит от activeWorkspace, current_user, handleCloseModal


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
          loading={loading}
          isQuickCashExpense={true}
        />
      </Modal>
    </>
  );
}

export default memo(QuickCashExpenseForm); // <--- ЭКСПОРТИРУЕМ ОБЕРНУТЫЙ КОМПОНЕНТ