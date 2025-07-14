// frontend/src/pages/AccountsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Modal from '../components/Modal';
import AccountForm from '../components/forms/AccountForm';
import AccountCard from '../components/AccountCard'; 
import ConfirmationModal from '../components/ConfirmationModal';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button'; 
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { PlusIcon } from '@heroicons/react/24/solid';

function AccountsPage() {
  const { accounts, fetchDataForWorkspace, activeWorkspace, isLoading: authLoading } = useAuth();
  // ... (остальная логика остается без изменений) ...

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    setLoading(authLoading);
  }, [authLoading]);

  const handleOpenCreateModal = () => {
    setAccountToEdit(null);
    setIsModalOpen(true);
    setError('');
  };

  const handleOpenEditModal = (account) => {
    setAccountToEdit(account);
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAccountToEdit(null);
    setError('');
  };

  const handleDeleteRequest = (account) => {
    setAccountToDelete(account);
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    try {
      await apiService.deleteAccount(accountToDelete.id);
      if (activeWorkspace?.id) {
        await fetchDataForWorkspace(activeWorkspace.id);
      }
      setAccountToDelete(null);
      setError('');
    } catch (err) {
      let errorMessage = err.detail || err.message || 'Не удалось архивировать счет';
      if (errorMessage.includes("Нельзя архивировать счет с ненулевым балансом")) {
        errorMessage = `Невозможно архивировать счет "${accountToDelete.name}", так как его баланс не равен нулю.`;
      }
      setError(errorMessage);
    }
  };


  if (loading) {
    return <Loader text="Загрузка счетов..." />;
  }

  return (
    // Добавляем базовый цвет текста для страницы
    <div className="dark:text-gray-200">
      <div className="flex justify-between items-center mb-8">
        <PageTitle title="Ваши счета" />
        <Button onClick={handleOpenCreateModal} icon={<PlusIcon className="h-5 w-5 mr-2" />}>
          Добавить счет
        </Button>
      </div>

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
        // EmptyState уже должен быть адаптирован
        <EmptyState 
          message="У вас еще нет ни одного счета."
          buttonText="Создать первый счет"
          onButtonClick={handleOpenCreateModal}
        />
      )}

      {/* Modal и ConfirmationModal уже должны быть адаптированы */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={accountToEdit ? 'Редактировать счет' : 'Новый счет'}
      >
        <AccountForm account={accountToEdit} onSuccess={handleCloseModal} />
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(accountToDelete)}
        onClose={() => { setAccountToDelete(null); setError(''); }}
        onConfirm={handleDeleteConfirm}
        title="Архивировать счет" 
        message={`Вы уверены, что хотите архивировать счет "${accountToDelete?.name}"?`}
        errorAlertMessage={error} 
      />
    </div>
  );
}

export default AccountsPage;