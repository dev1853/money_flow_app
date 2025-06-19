// frontend/src/pages/AccountsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Компоненты
import Modal from '../components/Modal';
import AccountForm from '../components/AccountForm';
import AccountCard from '../components/AccountCard'; // <-- Импортируем новый компонент
import ConfirmationModal from '../components/ConfirmationModal';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { PlusIcon } from '@heroicons/react/24/solid';

function AccountsPage() {
  const { accounts, fetchAccounts, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    // Используем статус загрузки из AuthContext
    setLoading(authLoading);
  }, [authLoading]);

  // --- Функции для управления модальными окнами ---
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

  const handleDeleteRequest = (account) => {
    setAccountToDelete(account);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    try {
      await apiService.delete(`/accounts/${accountToDelete.id}`);
      await fetchAccounts(); // Обновляем список после удаления
      setAccountToDelete(null); 
    } catch (err) {
      console.error("Ошибка при удалении счета:", err);
      setError(err.message || 'Не удалось удалить счет');
    }
  };

  // --- Рендеринг ---
  if (loading) {
    return <Loader text="Загрузка счетов..." />;
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <PageTitle title="Ваши счета" />
        <Button onClick={handleOpenCreateModal} icon={<PlusIcon className="h-5 w-5 mr-2" />}>
          Добавить счет
        </Button>
      </div>

      {accounts && accounts.length > 0 ? (
        // --- НОВАЯ СЕТКА ДЛЯ КАРТОЧЕК ---
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

      {/* Модальные окна остаются без изменений */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={accountToEdit ? 'Редактировать счет' : 'Новый счет'}
      >
        <AccountForm account={accountToEdit} onSuccess={handleCloseModal} />
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить счет"
        message={`Вы уверены, что хотите удалить счет "${accountToDelete?.name}"? Все связанные с ним транзакции будут также удалены. Это действие необратимо.`}
      />
    </div>
  );
}

export default AccountsPage;