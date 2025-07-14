// frontend/src/pages/AccountBalancesReportPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Listbox, Transition } from '@headlessui/react';

import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { apiService, ApiError } from '../services/apiService';

import {
  FunnelIcon,
  BanknotesIcon as CashIcon,
  BuildingLibraryIcon as BankIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const AccountBalancesReportPage = () => {
  const [reportDate, setReportDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);

  const { isAuthenticated, isLoading: isAuthLoading, logout, activeWorkspace } = useAuth(); // Добавили activeWorkspace
  const navigate = useNavigate();

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";

  const fetchAccountsForFilter = useCallback(async () => {
    if (isAuthLoading || !isAuthenticated || !activeWorkspace) { // Проверяем activeWorkspace
      setAvailableAccounts([]);
      return;
    }
    try {
      const params = new URLSearchParams({ workspace_id: activeWorkspace.id }); // Добавляем workspace_id
      const data = await apiService.get(`/accounts/?limit=500&is_active=true&${params.toString()}`); // Объединяем параметры
      setAvailableAccounts(data || []);
    } catch (err) {
      console.error("AccountBalancesReportPage: Ошибка загрузки счетов:", err.message);
      setAvailableAccounts([]);
    }
  }, [isAuthLoading, isAuthenticated, activeWorkspace]); // Добавляем activeWorkspace в зависимости

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && activeWorkspace) { // Проверяем activeWorkspace
      fetchAccountsForFilter();
    }
  }, [fetchAccountsForFilter, isAuthenticated, isAuthLoading, activeWorkspace]); // Добавляем activeWorkspace

  const handleGenerateReport = useCallback(async () => {
    if (!reportDate || !isValid(reportDate)) {
      setError("Пожалуйста, выберите корректную дату отчета.");
      setReportData(null);
      return;
    }
    if (isAuthLoading) { return; }
    if (!isAuthenticated) {
      setError('Для доступа к отчетам необходимо войти в систему.');
      navigate('/login');
      return;
    }
    if (!activeWorkspace) { // Новая проверка
      setError("Рабочее пространство не выбрано. Выберите рабочее пространство, чтобы сформировать отчет.");
      setReportData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setReportData(null);

    const params = new URLSearchParams();
    params.append('as_of_date', format(reportDate, 'yyyy-MM-dd'));
    selectedAccounts.forEach(account => params.append('account_ids', account.id.toString()));
    params.append('workspace_id', activeWorkspace.id); // Добавляем workspace_id

    try {
      const data = await apiService.get(`/reports/account-balances/?${params.toString()}`);
      setReportData(data);
    } catch (err) {
      console.error("AccountBalancesReportPage: Ошибка при формировании отчета:", err);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.');
          logout();
        } else {
          setError(err.message || 'Не удалось загрузить отчет');
        }
      } else {
        setError(err.message || "Произошла неизвестная ошибка при формировании отчета");
      }
    } finally {
      setIsLoading(false);
    }
  }, [reportDate, selectedAccounts, isAuthenticated, isAuthLoading, navigate, logout, activeWorkspace]); // Добавляем activeWorkspace

  const handleDateChange = (date) => { setReportDate(date); };

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && reportDate && isValid(reportDate) && activeWorkspace) { // Проверяем activeWorkspace
       handleGenerateReport();
    }
  }, [isAuthenticated, isAuthLoading, reportDate, selectedAccounts, handleGenerateReport, activeWorkspace]); // Добавляем activeWorkspace

  const formatCurrency = (amount, currency = 'RUB') => {
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 2 });
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader message="Загрузка данных страницы..." />
      </div>
    );
  }

  // Если рабочее пространство не выбрано, показываем соответствующее состояние
  if (!activeWorkspace && !isAuthLoading) {
    return (
      <EmptyState
          icon={DocumentMagnifyingGlassIcon} // Используем иконку для отчетов
          title="Рабочее пространство не выбрано"
          message="Пожалуйста, выберите или создайте рабочее пространство для формирования отчетов."
          className="mt-0"
      />
    );
  }

  return (
    <div className="space-y-6 dark:text-gray-200">
      <PageTitle title='Отчет "Остатки денежных средств"' />

      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-grow min-w-[240px] sm:flex-none sm:w-64">
            <label htmlFor="reportDateBalances" className={commonLabelClasses}>На дату</label>
            <DatePicker
              selected={reportDate}
              onChange={handleDateChange}
              dateFormat="dd.MM.yyyy"
              locale={ru}
              className={commonInputClasses + " w-full"}
              wrapperClassName="w-full"
              isClearable={true}
              placeholderText="Выберите дату"
              id="reportDateBalances"
              disabled={!activeWorkspace} // Отключаем, если нет активного пространства
            />
          </div>
          <div className="flex-grow min-w-[260px] sm:flex-1">
            <label htmlFor="accountsFilterBalances" className={commonLabelClasses}>Счета/Кассы <span className="text-xs text-gray-500">(по умолч. все)</span></label>
            <Listbox value={selectedAccounts} onChange={setSelectedAccounts} multiple name="accountsFilterBalances" disabled={!activeWorkspace}> {/* Отключаем, если нет активного пространства */}
              <div className="relative mt-1">
                <Listbox.Button id="accountsFilterBalances" className={`${commonInputClasses} text-left pr-10 relative ${!activeWorkspace ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                  <span className="block truncate">
                    {selectedAccounts.length === 0 ? "Все активные счета" : selectedAccounts.length === availableAccounts.length && availableAccounts.length > 0 ? "Все активные счета (выбраны)" : selectedAccounts.length > 2  ? `${selectedAccounts.length} счетов выбрано` : selectedAccounts.map(acc => acc.name).join(', ') || "Все активные счета"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"> <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /> </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" >
                  <Listbox.Options className="absolute z-20 mt-1 max-h-56 w-full min-w-max overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {availableAccounts.map((account) => (
                      <Listbox.Option key={account.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900' }`} value={account} >
                        {({ selected }) => ( <> <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}> {account.name} ({account.currency}) </span> {selected ? ( <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600`}> <CheckIcon className="h-5 w-5" aria-hidden="true" /> </span> ) : null} </> )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateReport}
              disabled={isLoading || !reportDate || !isAuthenticated || !activeWorkspace} // Добавляем activeWorkspace
              iconLeft={<FunnelIcon className="h-5 w-5" />}
              className="w-full sm:w-auto"
              title="Сформировать отчет"
            >
              <span className="hidden sm:inline">Сформировать</span>
              <span className="sm:hidden">Отчет</span>
            </Button>
          </div>
        </div>
        {error && !isLoading && (
            <Alert type="error" message={error} className="mt-4" />
        )}
      </div>

      {isLoading && !isAuthLoading && (
         <Loader message="Формирование отчета..." containerClassName="text-center py-10" />
      )}
      
      {!isLoading && !isAuthLoading && reportData && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 pb-3 border-b border-gray-200 dark:border-gray-700 text-center">
            Остатки денежных средств на {reportData.report_date ? format(parseISO(reportData.report_date), "dd MMMM Geißler 'г.'", { locale: ru }) : '?'}
          </h3>
          
          {reportData.balances && reportData.balances.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 sm:pl-6">Счет/Касса</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Тип</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Остаток</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {reportData.balances.map(item => (
                    <tr key={item.account_id} className="even:bg-gray-50 dark:even:bg-gray-900/50 hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          {item.account_type === 'bank_account' 
                            ? <BankIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" /> 
                            : <CashIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          }
                          <span className="font-medium text-gray-900">{item.account_name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {item.account_type === 'bank_account' ? 'Банковский счет' : 'Касса'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-800">
                        {formatCurrency(item.current_balance, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Нет данных по остаткам.</p>
          )}

          {reportData.total_balances_by_currency && Object.keys(reportData.total_balances_by_currency).length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Итоги по валютам:</h4>
              {Object.entries(reportData.total_balances_by_currency).map(([currency, total]) => (
                <div key={currency} className="flex justify-between items-center text-md p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Всего {currency}:</span>
                  <span className={`font-bold text-xl ${parseFloat(total) >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

       {!isLoading && !isAuthLoading && !reportData && !error && (
        <EmptyState
            icon={DocumentMagnifyingGlassIcon}
            title="Отчет не сформирован"
            message='Выберите параметры и нажмите "Сформировать отчет".'
            className="mt-0"
        />
       )}
    </div>
  );
};

export default AccountBalancesReportPage;