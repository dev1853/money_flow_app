// src/pages/AccountsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import AccountForm from '../components/AccountForm';
import ConfirmationModal from '../components/ConfirmationModal';
// Наши новые компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

import {
  PlusIcon,
  BanknotesIcon,      // Также используется для EmptyState
  BuildingLibraryIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/solid'; //

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]); //
  const [isLoading, setIsLoading] = useState(true); //
  const [error, setError] = useState(null); //

  const [isFormModalOpen, setIsFormModalOpen] = useState(false); //
  const [editingAccount, setEditingAccount] = useState(null); //

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); //
  const [confirmModalProps, setConfirmModalProps] = useState({ //
    message: '',
    onConfirm: () => {},
    title: "Подтверждение",
    confirmText: "Да",
    confirmButtonVariant: "primary"
  });

  const fetchAccounts = useCallback(async () => { //
    setIsLoading(true);
    try {
      setError(null);
      const response = await fetch('http://localhost:8000/accounts/');
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Ошибка сервера");
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setAccounts(data);
    } catch (e) {
      setError(e.message);
      console.error("Ошибка при загрузке счетов:", e);
    } finally {
      setIsLoading(false);
    }
  }, []); //

  useEffect(() => { //
    fetchAccounts();
  }, [fetchAccounts]); //

  const handleOpenCreateModal = () => { //
    setEditingAccount(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (account) => { //
    setEditingAccount(account);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => { //
    setIsFormModalOpen(false);
    setEditingAccount(null);
  };

  const handleFormSubmitSuccess = () => { //
    fetchAccounts();
    setIsFormModalOpen(false);
    setEditingAccount(null);
  };

  const handleToggleActiveStatus = (accountToToggle) => { //
    const newActiveState = !accountToToggle.is_active;
    const actionText = newActiveState ? 'активировать' : 'деактивировать';

    setConfirmModalProps({ //
      title: "Подтверждение статуса",
      message: `Вы уверены, что хотите ${actionText} счет "${accountToToggle.name}"?`,
      confirmText: newActiveState ? "Активировать" : "Деактивировать",
      confirmButtonVariant: "primary",
      onConfirm: async () => {
        try {
          setError(null);
          const payload = {
            name: accountToToggle.name,
            account_type: accountToToggle.account_type,
            currency: accountToToggle.currency,
            initial_balance: parseFloat(accountToToggle.initial_balance),
            is_active: newActiveState
          };

          const response = await fetch(`http://localhost:8000/accounts/${accountToToggle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({detail: `Не удалось ${actionText} счет`}));
            throw new Error(errorData.detail || `Не удалось ${actionText} счет`);
          }
          fetchAccounts();
        } catch (err) {
          setError(err.message || `Ошибка при ${actionText}`);
          console.error(`Ошибка при ${actionText}:`, err);
        }
      }
    });
    setIsConfirmModalOpen(true); //
  };

  const AccountTypeIcon = ({ type }) => { //
    if (type === 'bank_account') {
      return <BuildingLibraryIcon className="h-6 w-6 text-blue-600" title="Банковский счет" />;
    } else if (type === 'cash_box') {
      return <BanknotesIcon className="h-6 w-6 text-green-600" title="Касса" />;
    }
    return null;
  };

  return (
    <>
      <PageTitle
        title="Счета и Кассы"
        actions={
          <Button
            variant="primary"
            size="md" // Соответствует оригинальным классам px-3.5 py-2.5 text-sm
            onClick={handleOpenCreateModal}
            iconLeft={<PlusIcon className="h-5 w-5" />} // Оригинальный класс -ml-0.5 h-5 w-5
          >
            Добавить счет/кассу
          </Button>
        }
      />

      <Modal
        isOpen={isFormModalOpen} //
        onClose={handleCloseFormModal} //
        title={editingAccount ? `Редактировать: ${editingAccount.name}` : "Добавить новый счет/кассу"} //
      >
         <AccountForm
          onAccountActionSuccess={handleFormSubmitSuccess} //
          accountToEdit={editingAccount} //
          onCancelEdit={handleCloseFormModal} //
          key={editingAccount ? `edit-acc-${editingAccount.id}` : 'create-acc'} //
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen} //
        onClose={() => setIsConfirmModalOpen(false)} //
        title={confirmModalProps.title} //
        message={confirmModalProps.message} //
        onConfirm={confirmModalProps.onConfirm} //
        confirmText={confirmModalProps.confirmText} //
        cancelText="Отмена" //
        confirmButtonVariant={confirmModalProps.confirmButtonVariant} //
      />

      <div className="mt-8"> {/* Этот отступ можно убрать, если PageTitle уже дает достаточный mb-6 */}
        {isLoading && (
            <Loader message="Загрузка счетов..." containerClassName="py-10" />
        )}

        {!isLoading && error && ( //
          <Alert type="error" title="Ошибка!" message={error} className="my-4" />
        )}

        {!isLoading && !error && accounts.length === 0 && ( //
          <EmptyState
            icon={BanknotesIcon} //
            title="Счетов и касс пока нет" //
            message="Начните с добавления первого счета или кассы." //
            actionButton={ // Добавим кнопку действия прямо в EmptyState для удобства
                <Button variant="primary" onClick={handleOpenCreateModal} iconLeft={<PlusIcon className="h-5 w-5"/>}>
                    Добавить первый счет
                </Button>
            }
          />
        )}

        {!isLoading && !error && accounts.length > 0 && ( //
          <div className="bg-white shadow-md rounded-lg overflow-hidden"> {/* */}
            <ul className="divide-y divide-gray-200"> {/* */}
              {accounts.map((account) => ( //
                <li key={account.id} className={`p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-gray-50 ${!account.is_active ? 'opacity-60 bg-gray-50' : ''}`}> {/* */}
                    <div className="flex items-center mb-2 sm:mb-0"> {/* */}
                        <AccountTypeIcon type={account.account_type} /> {/* */}
                        <div className="ml-3"> {/* */}
                        <p className={`text-lg font-semibold ${!account.is_active ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{account.name}</p> {/* */}
                        <p className="text-sm text-gray-500"> {/* */}
                            {account.account_type === 'bank_account' ? 'Банковский счет' : 'Касса'} - {account.currency} {/* */}
                        </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4"> {/* */}
                        <div className="text-left sm:text-right mb-2 sm:mb-0"> {/* */}
                        <p className={`text-md font-semibold ${parseFloat(account.current_balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}> {/* */}
                            {parseFloat(account.current_balance).toLocaleString('ru-RU', { style: 'currency', currency: account.currency, minimumFractionDigits: 2 })} {/* */}
                        </p>
                        <p className={`text-xs ${account.is_active ? 'text-green-500' : 'text-gray-400'}`}> {/* */}
                            {account.is_active ? 'Активен' : 'Неактивен'} {/* */}
                        </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="icon"
                            size="md" // p-2 для варианта icon + md
                            onClick={() => handleOpenEditModal(account)} //
                            title="Редактировать"
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-100 focus:ring-blue-500 rounded-full" //
                          >
                            <PencilIcon className="h-5 w-5" /> {/* */}
                          </Button>
                          <Button
                            variant="icon"
                            size="md"
                            onClick={() => handleToggleActiveStatus(account)} //
                            title={account.is_active ? 'Деактивировать' : 'Активировать'} //
                            className={`rounded-full hover:bg-gray-100 ${account.is_active ? 'text-gray-400 hover:text-yellow-600 focus:ring-yellow-500' : 'text-gray-400 hover:text-green-600 focus:ring-green-500'}`} //
                          >
                            {account.is_active ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />} {/* */}
                          </Button>
                        </div>
                    </div>
                    </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default AccountsPage; //