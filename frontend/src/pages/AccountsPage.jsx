// frontend/src/pages/AccountsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import AccountForm from '../components/AccountForm';
import ConfirmationModal from '../components/ConfirmationModal';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button'; // Нужен для кнопок в футере модального окна
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { apiService, ApiError } from '../services/apiService'; // Используем apiService

import {
  PlusIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/solid';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]); //
  const [isLoading, setIsLoading] = useState(true); // Общий isLoading для страницы (загрузка списка, операции)
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

  const ACCOUNT_FORM_ID = "account-form-in-modal"; // ID для формы счета

  const fetchAccounts = useCallback(async () => { //
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get('/accounts/'); // Используем apiService
      setAccounts(data || []);
    } catch (e) { //
      console.error("Ошибка при загрузке счетов:", e);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить список счетов.");
      setAccounts([]);
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
    setError(null); // Сбрасываем ошибки формы при закрытии
  };

  const handleFormSubmitSuccess = () => { //
    fetchAccounts();
    handleCloseFormModal();
  };

  const handleToggleActiveStatus = (accountToToggle) => { //
    const newActiveState = !accountToToggle.is_active;
    const actionText = newActiveState ? 'активировать' : 'деактивировать';
    setError(null);

    setConfirmModalProps({ //
      title: "Подтверждение статуса",
      message: `Вы уверены, что хотите ${actionText} счет "${accountToToggle.name}"?`,
      confirmText: newActiveState ? "Активировать" : "Деактивировать",
      confirmButtonVariant: "primary",
      onConfirm: async () => {
        setIsLoading(true); // Показываем индикатор загрузки на время операции
        try {
          const payload = { //
            name: accountToToggle.name,
            account_type: accountToToggle.account_type,
            currency: accountToToggle.currency,
            initial_balance: parseFloat(accountToToggle.initial_balance),
            is_active: newActiveState
          };
          await apiService.put(`/accounts/${accountToToggle.id}`, payload); // Используем apiService
          // Оптимистичное обновление или перезагрузка fetchAccounts()
          setAccounts(prev => prev.map(acc => acc.id === accountToToggle.id ? {...acc, is_active: newActiveState} : acc));
          // fetchAccounts(); // Можно и так, но оптимистичное обновление быстрее для UI
        } catch (err) { //
          console.error(`Ошибка при ${actionText}:`, err);
          setError(err instanceof ApiError ? err.message : `Не удалось ${actionText} счет.`);
        } finally {
            setIsLoading(false);
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

  // Формируем JSX для футера модального окна с AccountForm
  const accountFormFooter = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={handleCloseFormModal}>
        Отмена
      </Button>
      <Button
        type="submit" // Этот submit будет работать для формы с указанным ID
        form={ACCOUNT_FORM_ID}  // Связываем кнопку с формой по ID
        variant="primary"
        size="md"
        // isLoading для кнопки футера лучше брать из AccountForm, если бы он его прокидывал,
        // либо AccountForm должен сам управлять своим isLoading при сабмите.
        // Сейчас AccountForm имеет свой isLoading, но кнопка вовне.
        // Для простоты, кнопка submit не будет иметь своего isLoading состояния здесь,
        // но AccountForm при сабмите установит свой isLoading, что может заблокировать поля.
        // Если AccountForm.isLoading (при сабмите) должен блокировать эту кнопку, нужна более сложная логика.
      >
        {editingAccount ? 'Сохранить изменения' : 'Создать счет/кассу'}
      </Button>
    </div>
  );

  return (
    <>
      <PageTitle
        title="Счета и Кассы"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            iconLeft={<PlusIcon className="h-5 w-5" />}
          >
            Добавить счет/кассу
          </Button>
        }
      />

      {isFormModalOpen && ( // Рендерим Modal только если он открыт, чтобы AccountForm перемонтировался
        <Modal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          title={editingAccount ? `Редактировать: ${editingAccount.name}` : "Добавить новый счет/кассу"}
          footer={accountFormFooter}
        >
          <AccountForm
            formId={ACCOUNT_FORM_ID} // Передаем ID для связи с кнопкой submit
            onAccountActionSuccess={handleFormSubmitSuccess}
            accountToEdit={editingAccount}
            key={editingAccount ? `edit-acc-${editingAccount.id}` : 'create-acc'} // key для сброса состояния формы
          />
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen} //
        onClose={() => setIsConfirmModalOpen(false)} //
        {...confirmModalProps} //
      />

      <div className="mt-6"> {/* Уменьшил отступ, т.к. PageTitle имеет mb-6 */}
        {isLoading && accounts.length === 0 && <Loader message="Загрузка счетов..." containerClassName="py-10" />} {/* */}
        {!isLoading && error && accounts.length === 0 && <Alert type="error" title="Ошибка загрузки!" message={error} className="my-4" />} {/* */}
        
        {/* Показываем ошибку операции, если список уже есть */}
        {!isLoading && error && accounts.length > 0 && <Alert type="error" title="Ошибка операции!" message={error} className="my-4" />}


        {!isLoading && !error && accounts.length === 0 && ( //
          <EmptyState
            icon={BanknotesIcon} //
            title="Счетов и касс пока нет" //
            message="Начните с добавления первого счета или кассы." //
            actionButton={
                <Button variant="primary" onClick={handleOpenCreateModal} iconLeft={<PlusIcon className="h-5 w-5"/>}>
                    Добавить первый счет
                </Button>
            }
          />
        )}

        {!isLoading && accounts.length > 0 && ( //
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
                        <div className="flex space-x-2"> {/* */}
                          <Button
                            variant="icon"
                            size="md"
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

export default AccountsPage;