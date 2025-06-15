// frontend/src/pages/AccountsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AccountForm from '../components/AccountForm';
import Modal from '../components/Modal';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const { activeWorkspace } = useAuth();

  // Определяем уникальный ID для формы аккаунта
  const ACCOUNT_FORM_ID = "accountForm";

  const fetchAccounts = useCallback(async () => {
    if (!activeWorkspace) {
        setIsLoading(false); // Устанавливаем isLoading в false, если нет активного пространства
        return;
    }
    
    setIsLoading(true);
    setError('');
    try {
        const params = new URLSearchParams({
            workspace_id: activeWorkspace.id,
        });
        const data = await apiService.get(`/accounts?${params.toString()}`);
        setAccounts(data);
    } catch (err) {
        console.error("Ошибка при загрузке счетов:", err);
        setError('Не удалось загрузить список счетов. ' + err.message);
    } finally {
        setIsLoading(false);
    }
}, [activeWorkspace]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenModal = (account = null) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    fetchAccounts(); // Обновляем список после успешного сохранения
  };

  // Футер для модального окна AccountForm
  const modalFooter = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={handleCloseModal} disabled={isLoading}>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        form={ACCOUNT_FORM_ID} // Связываем кнопку с формой по ID
        disabled={isLoading} // Управляем состоянием кнопки извне формы
      >
        {isLoading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  );

  if (isLoading) {
    return <Loader message="Загрузка счетов..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Счета" />
        <Button 
          onClick={() => handleOpenModal()} 
          variant="primary" 
          size="md"
          disabled={!activeWorkspace} // Блокируем кнопку, если нет активного пространства
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить счет
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}
      
      {!activeWorkspace && (
         <EmptyState
            title="Рабочее пространство не выбрано"
            message="Пожалуйста, выберите рабочее пространство в шапке сайта, чтобы увидеть счета."
          />
      )}

      {activeWorkspace && accounts.length === 0 && !error && (
        <EmptyState
          title="Счета еще не созданы"
          message="Начните с добавления вашего первого счета, например, 'Наличные' или 'Карта'."
          actionButton={<Button variant="primary" onClick={() => handleOpenModal()} iconLeft={<PlusIcon className="h-5 w-5"/>}>Добавить первый счет</Button>}
        />
      )}

      {activeWorkspace && accounts.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <li key={account.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{account.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {account.balance.toFixed(2)} {account.currency}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Начальный баланс: {account.initial_balance.toFixed(2)} {account.currency}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <button onClick={() => handleOpenModal(account)} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Редактировать
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingAccount ? 'Редактировать счет' : 'Новый счет'}
        formId={ACCOUNT_FORM_ID} // Передаем formId в Modal
        footer={modalFooter} // Передаем футер с кнопками
      >
        <AccountForm 
          accountToEdit={editingAccount} // Проп должен быть accountToEdit
          onAccountActionSuccess={handleFormSuccess} 
          formId={ACCOUNT_FORM_ID} // Передаем formId в AccountForm
          // onCancelEdit больше не нужен, т.к. кнопки снаружи
        />
      </Modal>
    </div>
  );
};

export default AccountsPage;