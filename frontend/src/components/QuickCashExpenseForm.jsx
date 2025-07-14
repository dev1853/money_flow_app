// frontend/src/components/QuickCashExpenseForm.jsx
import React, { useState, useCallback, memo } from 'react';
import Modal from './Modal'; // This component is already adapted
import Button from './Button'; // This component is already adapted
import TransactionForm from './forms/TransactionForm'; // This form is the next target
import Alert from './Alert'; // We will adapt this component now
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// This component's logic remains the same. Its appearance is determined
// by the child components (Button, Modal, Alert, TransactionForm).
function QuickCashExpenseForm() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { activeWorkspace, accounts, ddsArticles, fetchDataForWorkspace } = useAuth();

  const handleOpenModal = useCallback(() => {
    setSuccessMessage('');
    setErrorMessage('');
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleQuickExpenseSubmit = useCallback(async (formData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (!activeWorkspace?.id) {
        throw new Error("Рабочее пространство не выбрано или неактивно.");
      }
      await apiService.createTransaction(formData);
      setSuccessMessage("Расход успешно добавлен!");
      fetchDataForWorkspace(activeWorkspace.id);
      setTimeout(() => handleCloseModal(), 1500); // Close modal after a short delay
    } catch (err) {
      setErrorMessage(err.message || "Не удалось добавить расход.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace, handleCloseModal, fetchDataForWorkspace]);

  return (
    <>
      <Button onClick={handleOpenModal}>Быстрый расход</Button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Быстрый расход">
        {successMessage && <Alert type="success" className="mb-4">{successMessage}</Alert>}
        {errorMessage && <Alert type="error" className="mb-4">{errorMessage}</Alert>}
        
        <TransactionForm
          onSubmit={handleQuickExpenseSubmit}
          onCancel={handleCloseModal}
          accounts={accounts || []}
          articles={ddsArticles || []}
          defaultType="EXPENSE"
          isSubmitting={loading}
        />
      </Modal>
    </>
  );
}

export default memo(QuickCashExpenseForm);