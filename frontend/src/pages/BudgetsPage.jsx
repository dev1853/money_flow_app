// frontend/src/pages/BudgetsPage.jsx

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import BudgetCard from '../components/BudgetCard';
import Loader from '../components/Loader';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Modal from '../components/Modal';
import BudgetForm from '../components/forms/BudgetForm';
import ConfirmationModal from '../components/ConfirmationModal';
import Alert from '../components/Alert';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  const fetchBudgets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getBudgets();
      setBudgets(data);
    } catch (err) {
      setError('Ошибка загрузки бюджетов.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleOpenFormModal = (budget = null) => {
    setSelectedBudget(budget);
    setMutationError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (budget) => {
    setSelectedBudget(budget);
    setMutationError(null);
    setIsDeleteModalOpen(true);
  };
  
  const handleCloseModals = () => {
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedBudget(null);
  };

  const handleDelete = async () => {
    if (!selectedBudget) return;
    try {
      setMutationError(null);
      await apiService.deleteBudget(selectedBudget.id);
      handleCloseModals();
      fetchBudgets();
    } catch (err) {
      console.error("Ошибка удаления бюджета:", err);
      setMutationError(err.message || 'Не удалось удалить бюджет.');
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="dark:text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Бюджеты" />
        <Button onClick={() => handleOpenFormModal()}>Создать бюджет</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(budget => (
          <BudgetCard 
            key={budget.id} 
            budget={budget} 
            onEdit={handleOpenFormModal} 
            onDelete={handleOpenDeleteModal} 
          />
        ))}
      </div>

      {/* --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ --- */}
      {/* Убираем условный рендеринг '&&' и передаем isFormModalOpen в проп isOpen */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals}>
        <BudgetForm
          budget={selectedBudget}
          onSuccess={() => {
            handleCloseModals();
            fetchBudgets();
          }}
          onCancel={handleCloseModals}
        />
      </Modal>

      {/* То же самое делаем для модального окна подтверждения */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen} // Передаем состояние в isOpen
        title="Подтвердите удаление"
        message={`Вы уверены, что хотите удалить бюджет "${selectedBudget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={handleCloseModals}
        errorMessage={mutationError}
      />
    </div>
  );
};

export default BudgetsPage;