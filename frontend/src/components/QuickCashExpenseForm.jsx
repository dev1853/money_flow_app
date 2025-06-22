// frontend/src/components/QuickCashExpenseForm.jsx
import React, { useState, useEffect } from 'react'; // Убрал useMemo, т.к. не используется явно
import Modal from './Modal';
import Button from './Button';
import TransactionForm from './TransactionForm';
import Alert from './Alert';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

function QuickCashExpenseForm() {
  console.log("DEBUG(QuickExpense): Component Rendered."); // <--- ЛОГ РЕНДЕРА
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { activeWorkspace, current_user } = useAuth(); 

  useEffect(() => {
    console.log("DEBUG(QuickExpense): useEffect mounted/updated. activeWorkspace:", activeWorkspace); // <--- ЛОГ useEffect
    // Cleanup function
    return () => console.log("DEBUG(QuickExpense): useEffect cleanup.");
  }, [activeWorkspace]);


  const handleOpenModal = () => {
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(true);
    console.log("DEBUG(QuickExpense): Modal opened. showModal:", true); // <--- ЛОГ
  };

  const handleCloseModal = () => {
    console.log("DEBUG(QuickExpense): handleCloseModal called. showModal before:", showModal); // <--- ЛОГ
    setShowModal(false);
    setSuccessMessage('');
    setErrorMessage('');
    console.log("DEBUG(QuickExpense): Modal closed. showModal after:", false); // <--- ЛОГ
  };

  const handleQuickExpenseSubmit = async (formData) => {
    console.log("DEBUG(QuickExpense): handleQuickExpenseSubmit invoked!");
    console.log("DEBUG(QuickExpense): Input formData:", JSON.stringify(formData));
    console.log("DEBUG(QuickExpense): activeWorkspace during submit:", activeWorkspace);
    console.log("DEBUG(QuickExpense): current_user during submit:", current_user);

    console.log("DEBUG(QuickExpense): Starting state updates for loading..."); // <--- НОВЫЙ ЛОГ
    setLoading(true);
    console.log("DEBUG(QuickExpense): Loading state set."); // <--- НОВЫЙ ЛОГ
    setErrorMessage('');
    console.log("DEBUG(QuickExpense): Error message cleared."); // <--- НОВЫЙ ЛОГ
    setSuccessMessage('');
    console.log("DEBUG(QuickExpense): Success message cleared."); // <--- НОВЫЙ ЛОГ

    try {
      console.log("DEBUG(QuickExpense): Entered try block, checking activeWorkspace..."); // <--- НОВЫЙ ЛОГ
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
  };

  // *** ВРЕМЕННЫЙ ОТЛАДОЧНЫЙ ВЫВОД В UI ***
  const debugInfo = `
    Type of handleQuickExpenseSubmit: ${typeof handleQuickExpenseSubmit} | 
    activeWorkspace ID: ${activeWorkspace ? activeWorkspace.id : 'null'} |
    current_user username: ${current_user ? current_user.username : 'null'} |
    showModal state: ${showModal} |
    loading state: ${loading}
  `;
  // *************************************

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