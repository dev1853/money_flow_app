// frontend/src/pages/AccountsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Компоненты
import Modal from '../components/Modal';
import AccountForm from '../components/forms/AccountForm';
import AccountCard from '../components/AccountCard'; 
import ConfirmationModal from '../components/ConfirmationModal'; // Обновленный компонент
import PageTitle from '../components/PageTitle';
import Button from '../components/Button'; 
import Alert from '../components/Alert'; // Alert теперь будет использоваться внутри ConfirmationModal
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { PlusIcon } from '@heroicons/react/24/solid';

function AccountsPage() {
  const { accounts, fetchDataForWorkspace, activeWorkspace, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Состояние для ошибки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    setLoading(authLoading);
    console.log('DEBUG: AccountsPage current error state:', error); 
  }, [authLoading, error]); 

  // --- Функции для управления модальными окнами ---
  const handleOpenCreateModal = () => {
    setAccountToEdit(null);
    setIsModalOpen(true);
    setError(''); // Очищаем ошибку при открытии модального окна создания/редактирования
  };

  const handleOpenEditModal = (account) => {
    setAccountToEdit(account);
    setIsModalOpen(true);
    setError(''); // Очищаем ошибку
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAccountToEdit(null);
    setError(''); // Очищаем ошибку при закрытии модального окна AccountForm
  };

  const handleDeleteRequest = (account) => {
    setAccountToDelete(account);
    setError(''); // Очищаем ошибку при открытии модального окна подтверждения
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    try {
      await apiService.deleteAccount(accountToDelete.id); 
      if (activeWorkspace?.id) {
        await fetchDataForWorkspace(activeWorkspace.id); 
      }
      setAccountToDelete(null); // Закрываем модальное окно при успехе
      setError(''); // Очищаем ошибку при успехе
    } catch (err) {
      console.error("Ошибка при архивировании счета (сырой объект ошибки):", err); 

      let errorMessage = err.detail || err.message || 'Не удалось архивировать счет';

      if (errorMessage.includes("Нельзя архивировать счет с ненулевым балансом")) {
        errorMessage = `Невозможно архивировать счет "${accountToDelete.name}", так как его баланс не равен нулю. 
                        Пожалуйста, переведите все средства со счета или обнулите его баланс, 
                        прежде чем отправлять в архив.`;
      }
      setError(errorMessage); // Устанавливаем ошибку
      // ИСПРАВЛЕНИЕ: НЕ ЗАКРЫВАЕМ модальное окно здесь при ошибке.
      // Оно останется открытым, показывая Alert внутри, и пользователь закроет его вручную.
      // setAccountToDelete(null); // Эту строку удаляем отсюда!
    }
  };

  // --- Рендеринг ---
  if (loading) {
    return <Loader text="Загрузка счетов..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <PageTitle title="Ваши счета" />
        <Button onClick={handleOpenCreateModal} icon={<PlusIcon className="h-5 w-5 mr-2" />}>
          Добавить счет
        </Button>
      </div>

      {/* ИСПРАВЛЕНИЕ: Удаляем верхнеуровневый Alert и отладочный div */}
      {/* {error && (
        <div style="...">
          <p>ОТЛАДКА ОШИБКИ: {error}</p>
        </div>
      )}
      {error && (
        <div className="mb-4"> 
          <Alert type="error">{error}</Alert>
        </div>
      )} */}

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
        <AccountForm account={accountToEdit} onSuccess={handleCloseModal} />
      </Modal>

      {/* ИСПРАВЛЕНИЕ: Передаем errorAlertMessage в ConfirmationModal */}
      <ConfirmationModal
        isOpen={Boolean(accountToDelete)}
        onClose={() => { setAccountToDelete(null); setError(''); }} // onClose также очищает ошибку
        onConfirm={handleDeleteConfirm}
        title="Архивировать счет" 
        message={`Вы уверены, что хотите архивировать счет "${accountToDelete?.name}"? 
          Счет будет помечен как неактивный и не будет отображаться в списке активных счетов. 
          Связанные транзакции останутся, но новые транзакции с этим счетом будут невозможны. 
          Вы сможете восстановить его позже, изменив его статус.`}
        errorAlertMessage={error} 
      />
    </div>
  );
}

export default AccountsPage;