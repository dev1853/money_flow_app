// frontend/src/pages/BudgetsPage.jsx

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Импорт хуков и компонентов
import { useDataFetching } from '../hooks/useDataFetching';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import BudgetForm from '../components/forms/BudgetForm';
import ConfirmationModal from '../components/ConfirmationModal';
import BudgetCard from '../components/BudgetCard'; // Убедитесь, что этот компонент существует

const BudgetsPage = () => {
    // 1. Получаем все необходимое из контекста useAuth
    const { activeWorkspace, loading: authLoading } = useAuth();
    const workspaceId = activeWorkspace?.id;

    // 2. Убираем ручное управление состоянием загрузки (isLoading, error, budgets)
    // Этим теперь будет заниматься useDataFetching

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [mutationError, setMutationError] = useState(null);

    // 3. Создаем правильную функцию для загрузки данных, которая зависит от workspaceId
    const fetchBudgets = useCallback(async () => {
        if (!workspaceId) return null; // Не делаем запрос, если нет ID

        return apiService.getBudgets({ workspace_id: workspaceId });
    }, [workspaceId]);

    // 4. Используем наш надежный хук useDataFetching
    const { 
        data: budgets, 
        loading, 
        error, 
        refetch: refetchBudgets 
    } = useDataFetching(
        fetchBudgets,
        [workspaceId], // Зависимость, чтобы перезагружать данные при смене воркспейса
        { skip: authLoading || !workspaceId } // Пропускаем запрос, пока нет ID
    );

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
            refetchBudgets(); // Используем refetch из хука
        } catch (err) {
            console.error("Ошибка удаления бюджета:", err);
            setMutationError(err.message || 'Не удалось удалить бюджет.');
        }
    };

    const handleCreateBudget = async (budgetData) => {
      return await apiService.createBudget(budgetData, { workspace_id: activeWorkspace?.id });
    };

    // 5. Добавляем защиту на случай отсутствия воркспейса или во время загрузки контекста
    if (authLoading) return <Loader text="Загрузка приложения..." />;
    if (!activeWorkspace) return <Alert type="info">Выберите рабочее пространство для просмотра бюджетов.</Alert>;

    return (
        <div className="dark:text-gray-200">
            <div className="flex justify-between items-center mb-6">
                <PageTitle title="Бюджеты" />
                <Button onClick={() => handleOpenFormModal()} data-tour="add-budget">
                    Создать бюджет
                </Button>
            </div>

            {error && <Alert type="error">{error.message}</Alert>}
            {loading && !budgets ? (
                <Loader text="Загрузка бюджетов..." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets && budgets.length > 0 ? (
                        budgets.map(budget => (
                            <BudgetCard 
                                key={budget.id} 
                                budget={budget} 
                                onEdit={handleOpenFormModal} 
                                onDelete={handleOpenDeleteModal} 
                            />
                        ))
                    ) : (
                        <Alert type="info">Бюджеты еще не созданы.</Alert>
                    )}
                </div>
            )}

            <Modal isOpen={isFormModalOpen} onClose={handleCloseModals}>
                <BudgetForm
                    budget={selectedBudget}
                    onSuccess={() => {
                        handleCloseModals();
                        refetchBudgets();
                    }}
                    onCancel={handleCloseModals}
                    workspaceId={workspaceId} 
                />
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
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