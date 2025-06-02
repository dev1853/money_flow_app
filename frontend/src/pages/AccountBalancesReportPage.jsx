// src/pages/AccountBalancesReportPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid, parseISO, startOfMonth, endOfMonth } from 'date-fns'; 
import { ru } from 'date-fns/locale';
import { Listbox, Transition } from '@headlessui/react';
// Проверьте эту строку импорта внимательно:
import { 
  DocumentChartBarIcon, 
  ExclamationTriangleIcon, 
  FunnelIcon, 
  BanknotesIcon as CashIcon,    
  BuildingLibraryIcon as BankIcon, 
  DocumentMagnifyingGlassIcon     
} from '@heroicons/react/24/outline';

import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'; // Убедитесь, что эти тоже импортированы

const AccountBalancesReportPage = () => {
  const [reportDate, setReportDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]); 

  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";
  const commonButtonClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10";

  const fetchAccountsForFilter = useCallback(async () => {
    if (!token && !isAuthLoading) { setAvailableAccounts([]); return; }
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch('http://localhost:8000/accounts/?limit=500&is_active=true', { headers });
      if (!response.ok) throw new Error('Ошибка загрузки счетов для фильтра');
      const data = await response.json();
      setAvailableAccounts(data);
    } catch (err) {
      console.error("AccountBalancesReportPage: Ошибка загрузки счетов:", err.message);
      setAvailableAccounts([]);
    }
  }, [token, isAuthLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccountsForFilter();
    }
  }, [fetchAccountsForFilter, isAuthenticated]);

  const handleGenerateReport = useCallback(async () => {
    if (!reportDate || !isValid(reportDate)) {
      setError("Пожалуйста, выберите корректную дату отчета.");
      setReportData(null);
      return;
    }
    if (isAuthLoading) { setIsLoading(false); return; }
    if (!isAuthenticated || !token) {
      setError('Для доступа к отчетам необходимо войти в систему.');
      navigate('/login');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setReportData(null);

    const params = new URLSearchParams();
    params.append('as_of_date', format(reportDate, 'yyyy-MM-dd'));
    selectedAccounts.forEach(account => params.append('account_ids', account.id.toString()));

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`http://localhost:8000/reports/account-balances/?${params.toString()}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Ошибка сервера: ${response.status}` }));
        if (response.status === 401) {
          setError('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.');
          navigate('/login');
        } else {
          setError(`HTTP error! status: ${response.status}, message: ${errorData.detail || 'Не удалось загрузить отчет'}`);
        }
        return;
      }
      const data = await response.json();
      setReportData(data);
    } catch (e) {
      setError(e.message || "Произошла неизвестная ошибка при формировании отчета");
    } finally {
      setIsLoading(false);
    }
  }, [reportDate, selectedAccounts, token, isAuthenticated, isAuthLoading, navigate]);
  
  const handleDateChange = (date) => { // DatePicker для одной даты возвращает Date, а не массив
    setReportDate(date);
  };
  
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && reportDate && isValid(reportDate)) {
       handleGenerateReport(); // Автоматическая загрузка при изменении даты или статуса аутентификации
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isAuthenticated, isAuthLoading, reportDate]); // Убрал handleGenerateReport из зависимостей, чтобы контролировать вызов

  const formatCurrency = (amount, currency = 'RUB') => {
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 2 });
  };
  
  if (isAuthLoading && isLoading) { // Показываем одну общую загрузку, пока проверяется auth и грузится отчет
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-500">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Отчет "Остатки денежных средств"</h2>
      </div>

{/* ОБНОВЛЕННЫЙ БЛОК ПАРАМЕТРОВ ОТЧЕТА */}
      <div className="p-4 bg-white shadow-xl rounded-lg mb-6"> {/* Немного уменьшил отступы и округление */}
        {/* <h3 className="text-lg font-semibold text-gray-800 mb-4">Параметры отчета</h3> */}
        <div className="flex flex-wrap items-end gap-4"> {/* Основной flex-контейнер */}
          
          {/* DatePicker */}
          <div className="flex-grow min-w-[240px] sm:flex-none sm:w-64"> {/* Гибкая ширина с минимумом */}
            <label htmlFor="reportDate" className={commonLabelClasses}>На дату</label>
            <DatePicker
              selected={reportDate}
              onChange={handleDateChange}
              dateFormat="dd.MM.yyyy"
              locale={ru}
              className={commonInputClasses + " w-full"}
              wrapperClassName="w-full"
              isClearable={true}
              placeholderText="Выберите дату"
            />
          </div>
          
          {/* Account Multiselect */}
          <div className="flex-grow min-w-[260px] sm:flex-1"> {/* Занимает больше места, если доступно */}
            <label className={commonLabelClasses}>Счета/Кассы <span className="text-xs text-gray-500">(по умолч. все)</span></label>
            <Listbox value={selectedAccounts} onChange={setSelectedAccounts} multiple name="accountsFilterReport">
              <div className="relative mt-1">
                <Listbox.Button className={`${commonInputClasses} text-left pr-10 relative`}>
                  <span className="block truncate">
                    {selectedAccounts.length === 0
                      ? "Все активные счета"
                      : selectedAccounts.length === availableAccounts.length && availableAccounts.length > 0
                      ? "Все активные счета (выбраны)"
                      : selectedAccounts.length > 2 
                      ? `${selectedAccounts.length} счетов выбрано` 
                      : selectedAccounts.map(acc => acc.name).join(', ') || "Все активные счета"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-20 mt-1 max-h-56 w-full min-w-max overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {availableAccounts.map((account) => (
                      <Listbox.Option
                        key={account.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                          }`
                        }
                        value={account} 
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                              {account.name} ({account.currency})
                            </span>
                            {selected ? (
                              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600`}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Кнопка "Сформировать отчет" */}
          <div className="flex-shrink-0"> {/* Кнопка не будет растягиваться */}
            <button 
              onClick={handleGenerateReport} 
              disabled={isLoading || !reportDate || !isAuthenticated}
              className={`w-full sm:w-auto ${commonButtonClasses} text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50`}
            >
              <FunnelIcon className="h-5 w-5 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Сформировать</span> {/* Текст кнопки скрыт на очень маленьких экранах */}
            </button>
          </div>
        </div>
        {/* Отображение ошибки теперь здесь, внутри карточки фильтров */}
        {error && !isLoading && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-2">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )}
      </div>
      {/* --- КОНЕЦ ОБНОВЛЕННОГО БЛОКА ФИЛЬТРОВ --- */}

      {/* Блок отображения отчета */}
      {/* Этот блок теперь показывается только если !isAuthLoading, чтобы избежать показа "Формирование отчета..." пока идет проверка auth */}
      {!isAuthLoading && isLoading && ( 
         <div className="text-center py-10 text-gray-500">
            <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" /* ... */ ></svg>
            <p className="mt-2">Формирование отчета...</p>
          </div>
      )}
      
      {!isLoading && !isAuthLoading && reportData && (
        <div className="bg-white shadow-xl rounded-2xl p-6 mt-8"> {/* Добавил mt-8 для отступа от фильтров */}
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 text-center">
            Остатки денежных средств на {reportData.report_date ? format(parseISO(reportData.report_date), 'dd MMMM yyyy г.', { locale: ru }) : '?'}
          </h3>
          
          {reportData.balances.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Счет/Касса</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700">Тип</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-700">Остаток</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {reportData.balances.map(item => (
                    <tr key={item.account_id} className="even:bg-gray-50 hover:bg-indigo-50/50 transition-colors">
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
            <p className="text-sm text-gray-500 py-8 text-center">Нет данных по остаткам для выбранных параметров.</p>
          )}

          {Object.keys(reportData.total_balances_by_currency).length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-gray-200 space-y-3">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Итоги по валютам:</h4>
              {Object.entries(reportData.total_balances_by_currency).map(([currency, total]) => (
                <div key={currency} className="flex justify-between items-center text-md p-3 bg-gray-50 rounded-lg shadow">
                  <span className="font-medium text-gray-700">Всего {currency}:</span>
                  <span className={`font-bold text-xl ${parseFloat(total) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

       {!isLoading && !isAuthLoading && !reportData && !error && (
        <div className="text-center py-16 bg-white shadow-lg rounded-xl">
            <DocumentMagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Отчет не сформирован</h3>
            <p className="mt-1 text-sm text-gray-500">Выберите параметры и нажмите "Сформировать отчет".</p>
        </div>
       )}
    </div>
  );
};

export default AccountBalancesReportPage;