// /frontend/src/pages/AccountsPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import AccountCard from '../components/AccountCard'; 
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import AccountForm from '../components/forms/AccountForm';
import ConfirmationModal from '../components/ConfirmationModal';
import { PlusIcon } from '@heroicons/react/24/solid';

function AccountsPage() {
    // 1. Получаем все напрямую из контекста. `loading` теперь называется `authLoading`
    const { accounts, activeWorkspace, loading: authLoading } = useAuth();

    // 2. Убираем лишние локальные состояния. Оставляем только для UI модальных окон
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);
    const [accountToDelete, setAccountToDelete] = useState(null);
    // Для ошибки можно оставить локальное состояние, если она специфична для этой страницы
    const [error, setError] = useState('');

    const handleOpenCreateModal = () => {
        setAccountToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (account) => {
        setAccountToEdit(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAccountToEdit(null);
    };

    // Логика удаления остается здесь, т.к. она специфична для этой страницы
    const handleDeleteRequest = (account) => {
        setAccountToDelete(account);
        setError('');
    };

    const handleDeleteConfirm = async () => {
        if (!accountToDelete) return;
        try {
            await apiService.deleteAccount(accountToDelete.id);
            // Прямой вызов refetch из AuthContext больше не нужен,
            // т.к. форма сама инициирует обновление.
            // Но для надежности можно оставить, если форма не используется.
            setAccountToDelete(null);
        } catch (err) {
            setError(err.message || 'Не удалось удалить счет');
        }
    };
    
    // 3. Проверяем состояние загрузки НАПРЯМУЮ из контекста
    if (authLoading) {
        return <Loader text="Загрузка счетов..." />;
    }

    return (
        <div className="dark:text-gray-200">
            <div className="flex justify-between items-center mb-8">
                <PageTitle title="Ваши счета" />
                <Button onClick={handleOpenCreateModal} data-tour="create-account">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Добавить счет
                </Button>
            </div>

            {/* Логика отображения теперь использует `accounts` напрямую из контекста */}
            {accounts && accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <AccountCard 
                            key={account.id} 
                            account={account}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteRequest}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState 
                    message="У вас еще нет ни одного счета."
                    buttonText="Создать первый счет"
                    onButtonClick={handleOpenCreateModal}
                />
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                title={accountToEdit ? 'Редактировать счет' : 'Новый счет'}
            >
                <AccountForm 
                    account={accountToEdit} 
                    onSuccess={handleCloseModal}
                    onCancel={handleCloseModal} 
                />
            </Modal>

            <ConfirmationModal
                isOpen={Boolean(accountToDelete)}
                onClose={() => setAccountToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Архивировать счет" 
                message={`Вы уверены, что хотите архивировать счет "${accountToDelete?.name}"?`}
                errorAlertMessage={error}
            />
        </div>
    );
}

export default AccountsPage;