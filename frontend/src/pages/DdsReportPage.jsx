// frontend/src/pages/DdsReportPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Listbox, Transition } from '@headlessui/react';

import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { apiService, ApiError } from '../services/apiService';

import {
  CheckIcon,
  ChevronUpDownIcon,
  DocumentChartBarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const DdsReportPage = () => {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Локальный isLoading для данных отчета
  const [error, setError] = useState(null);

  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);

  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";

  const fetchAccountsForFilter = useCallback(async () => {
    if (isAuthLoading || !isAuthenticated) {
      setAvailableAccounts([]);
      return;
    }
    try {
      const data = await apiService.get('/accounts/?limit=500&is_active=true');
      setAvailableAccounts(data || []);
    } catch (err) {
      console.error("DdsReportPage: Ошибка загрузки счетов:", err.message);
      setAvailableAccounts([]);
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchAccountsForFilter();
    }
  }, [fetchAccountsForFilter, isAuthenticated, isAuthLoading]);

  const handleGenerateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Пожалуйста, выберите начальную и конечную даты.");
      setReportData(null);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Дата начала не может быть позже даты окончания.");
      setReportData(null);
      return;
    }
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setError('Для доступа к отчетам необходимо войти в систему.');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReportData(null);

    const params = new URLSearchParams();
    if (isValid(startDate)) params.append('start_date', format(startDate, 'yyyy-MM-dd'));
    if (isValid(endDate)) params.append('end_date', format(endDate, 'yyyy-MM-dd'));
    selectedAccounts.forEach(account => params.append('account_ids', account.id.toString()));

    try {
      const data = await apiService.get(`/reports/dds/?${params.toString()}`);
      setReportData(data);
    } catch (err) {
      console.error("DdsReportPage: Ошибка при формировании отчета ДДС:", err);
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
  }, [startDate, endDate, selectedAccounts, isAuthenticated, isAuthLoading, navigate, logout]);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    // Автозагрузка при монтировании или изменении ключевых зависимостей
    if (isAuthenticated && !isAuthLoading && startDate && endDate) {
       handleGenerateReport();
    }
  }, [isAuthenticated, isAuthLoading, startDate, endDate, selectedAccounts, handleGenerateReport]); // Добавил selectedAccounts, так как отчет зависит и от них

  const formatCurrency = (amount, currency = 'RUB') => {
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 2 });
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader message="Проверка аутентификации..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Отчет о Движении Денежных Средств" />

      <div className="p-4 sm:p-6 bg-white shadow-xl rounded-2xl">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 border-b pb-3">Параметры отчета</h3>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
          <div className="flex-grow min-w-[280px] sm:flex-none sm:max-w-xs">
            <label htmlFor="dateRangeDds" className={commonLabelClasses}>Период</label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              isClearable={true}
              dateFormat="dd.MM.yyyy"
              placeholderText="Выберите диапазон дат"
              locale={ru}
              className={commonInputClasses + " w-full"}
              wrapperClassName="w-full"
              id="dateRangeDds"
            />
          </div>
          <div className="flex-grow min-w-[240px] sm:flex-1">
            <label htmlFor="accountsFilterDds" className={commonLabelClasses}>Счета/Кассы <span className="text-xs text-gray-500">(по умолч. все)</span></label>
            <Listbox value={selectedAccounts} onChange={setSelectedAccounts} multiple name="accountsFilterDds">
              <div className="relative mt-1">
                <Listbox.Button id="accountsFilterDds" className={`${commonInputClasses} text-left pr-10 relative`}>
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
          <div className="flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateReport}
              disabled={isLoading || !startDate || !endDate || !isAuthenticated}
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
        <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 text-center">
            Отчет ДДС c {reportData.start_date ? format(parseISO(reportData.start_date), 'dd MMMM yyyy г.', { locale: ru }) : '?'} по {reportData.end_date ? format(parseISO(reportData.end_date), 'dd MMMM yyyy г.', { locale: ru }) : '?'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-6">
            {/* Секция Доходов */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-semibold text-green-600 mb-3 pb-2 border-b border-gray-200">Доходы</h4>
              {reportData.income_items && reportData.income_items.length > 0 ? (
                <ul className="space-y-1">
                  {reportData.income_items.map(item => {
                    const drillDownUrl = `/transactions?start_date=${reportData.start_date}&end_date=${reportData.end_date}&dds_article_ids=${item.article_id}`;
                    return (
                      <li key={`inc-${item.article_id}`} className="py-1.5 flex justify-between text-sm group hover:bg-gray-50 px-1 rounded-md">
                        <Link to={drillDownUrl} className="text-gray-700 hover:text-indigo-600 hover:underline truncate" title={item.article_name}>
                          {item.article_name}
                        </Link>
                        <Link to={drillDownUrl} className="font-medium text-gray-800 group-hover:text-indigo-600 group-hover:underline flex-shrink-0 ml-2">
                          {formatCurrency(item.total_amount)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="text-sm text-gray-500">Доходов за период нет.</p>}
              <div className="mt-3 pt-3 border-t-2 border-green-500 flex justify-between font-bold text-green-600">
                <span>ИТОГО ДОХОДОВ:</span>
                <span>{formatCurrency(reportData.total_income)}</span>
              </div>
            </div>

            {/* Секция Расходов */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-semibold text-red-600 mb-3 pb-2 border-b border-gray-200">Расходы</h4>
              {reportData.expense_items && reportData.expense_items.length > 0 ? (
                <ul className="space-y-1">
                  {reportData.expense_items.map(item => {
                    const drillDownUrl = `/transactions?start_date=${reportData.start_date}&end_date=${reportData.end_date}&dds_article_ids=${item.article_id}`;
                    return (
                      <li key={`exp-${item.article_id}`} className="py-1.5 flex justify-between text-sm group hover:bg-gray-50 px-1 rounded-md">
                        <Link to={drillDownUrl} className="text-gray-700 hover:text-indigo-600 hover:underline truncate" title={item.article_name}>
                          {item.article_name}
                        </Link>
                        <Link to={drillDownUrl} className="font-medium text-gray-800 group-hover:text-indigo-600 group-hover:underline flex-shrink-0 ml-2">
                          {formatCurrency(item.total_amount)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="text-sm text-gray-500">Расходов за период нет.</p>}
              <div className="mt-3 pt-3 border-t-2 border-red-500 flex justify-between font-bold text-red-600">
                <span>ИТОГО РАСХОДОВ:</span>
                <span>{formatCurrency(reportData.total_expenses)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-300">
            <div className={`flex justify-between items-center text-xl font-bold ${parseFloat(reportData.net_cash_flow) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>Чистый денежный поток:</span>
              <span>{formatCurrency(reportData.net_cash_flow)}</span>
            </div>
          </div>
        </div>
      )}

       {!isLoading && !isAuthLoading && !reportData && !error && (
        <EmptyState
            icon={DocumentChartBarIcon}
            title="Отчет не сформирован"
            message='Выберите параметры и нажмите "Сформировать отчет".'
            className="mt-0" // Убираем верхний отступ, если он уже есть от space-y-6
        />
       )}
    </div>
  );
};

export default DdsReportPage;