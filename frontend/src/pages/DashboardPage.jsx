import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO, isValid } from 'date-fns';
import { useDataFetching } from '../hooks/useDataFetching';
import { getCurrentQuarterDates } from '../utils/dateUtils';
import { ru } from 'date-fns/locale';

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import KpiCard from '../components/KpiCard';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from '@heroicons/react/24/solid';

import LatestTransactionsWidget from '../components/dashboard/LatestTransactionsWidget';
import ExpensesByDdsArticlesWidget from '../components/dashboard/ExpensesByDdsArticlesWidget';
import ExpensesByCounterpartiesWidget from '../components/dashboard/ExpensesByCounterpartiesWidget';

// Импорт компонентов Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Импортируем наш хук для темы
import { useTheme } from '../contexts/ThemeContext';


function DashboardPage() {
  const { activeWorkspace } = useAuth();
  const { theme } = useTheme(); // 1. Получаем текущую тему

  const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // ... (логика получения данных остается без изменений) ...
  const fetchDashboardData = useCallback(async () => {
    if (!activeWorkspace?.id) {
      return {
        summaryData: null,
        trendData: [],
        latestTransactions: [],
        budgets: [],
        ddsReport: [],
        allTransactionsForAggregation: []
      };
    }
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    const [summary, trend, latestTransactions, budgets, ddsReport, allTransactionsForAggregation] = await Promise.all([
      apiService.getDashboardSummary(activeWorkspace.id, formattedStartDate, formattedEndDate),
      apiService.getDashboardCashflowTrend(activeWorkspace.id, formattedStartDate, formattedEndDate, 'day'),
      apiService.getTransactions({ workspace_id: activeWorkspace.id, limit: 5, order_by: 'transaction_date desc' }),
      apiService.getBudgets({ workspace_id: activeWorkspace.id, limit: 1, status: 'active' }),
      apiService.getDdsReport({
        workspace_id: activeWorkspace.id,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      }),
      apiService.getTransactions({ workspace_id: activeWorkspace.id, start_date: formattedStartDate, end_date: formattedEndDate, limit: 1000 }),
    ]);
    return {
      summaryData: summary,
      trendData: trend,
      latestTransactions: latestTransactions?.items || [],
      budgets: budgets?.items || [],
      ddsReport: ddsReport,
      allTransactionsForAggregation: allTransactionsForAggregation?.items || [],
    };
  }, [activeWorkspace, startDate, endDate]);

  const { data, loading, error, refetch: handleGenerateReport } = useDataFetching(
    fetchDashboardData,
    [activeWorkspace, startDate, endDate],
    { skip: !activeWorkspace || !startDate || !endDate }
  );

  const summaryData = data?.summaryData;
  const trendData = data?.trendData;
  const latestTransactions = data?.latestTransactions;
  const ddsReport = data?.ddsReport;
  const allTransactionsForAggregation = data?.allTransactionsForAggregation;

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    const summary = summaryData?.summary_by_currency?.[0];
    return {
      totalIncome: parseFloat(summary?.total_income) || 0,
      totalExpense: parseFloat(summary?.total_expense) || 0,
      netProfit: parseFloat(summary?.net_balance) || 0,
    };
  }, [summaryData]);

  const incomeTrend = totalIncome > 0 ? '+12.5%' : '-0.0%';
  const expenseTrend = totalExpense > 0 ? '-5.3%' : '+0.0%';
  const netProfitTrend = netProfit > 0 ? '+8.1%' : '-2.0%';

  const incomeTrendColor = totalIncome > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';
  const expenseTrendColor = totalExpense > 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-gray-400';
  const netProfitColor = netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';

  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map(item => {
      const date = parseISO(item.period);
      return {
        ...item,
        income: parseFloat(item.income) || 0,
        expense: parseFloat(item.expense) || 0,
        event_date_formatted: isValid(date) ? format(date, 'dd MMM', { locale: ru }) : 'N/A'
      };
    });
  }, [trendData]);


  return (
    // 2. ДОБАВЛЯЕМ ЦВЕТ ТЕКСТА ПО УМОЛЧАНИЮ ДЛЯ СТРАНИЦЫ
    <div className="text-gray-900 dark:text-gray-200">
      <div className="sm:flex sm:items-center sm:flex-wrap">
          <PageTitle title="Дашборд" className="mb-6 sm:mb-0" />
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none">
            {/* 3. АДАПТИРУЕМ БЛОК С ФИЛЬТРАМИ */}
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-transparent dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                    <DatePicker label="Начало периода" selected={startDate} onChange={date => setStartDate(date)} />
                    <DatePicker label="Конец периода" selected={endDate} onChange={date => setEndDate(date)} />
                    <Button onClick={handleGenerateReport} disabled={loading}>
                        {loading ? 'Загрузка...' : 'Обновить'}
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error.message || "Ошибка загрузки данных."}</Alert>}
      {loading && <Loader text="Загрузка данных дашборда..." />}

      {/* 4. АДАПТИРУЕМ КАРТОЧКИ KPI */}
      {summaryData && !loading && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <KpiCard
            title="Доходы"
            value={`${totalIncome.toFixed(2)} ${activeWorkspace?.currency || ''}`}
            icon={ArrowTrendingUpIcon}
            iconBgColor="bg-green-100 dark:bg-green-900/40"
            iconColor="text-green-500 dark:text-green-400"
            valueColor="text-green-600 dark:text-green-400"
            trendPercentage={incomeTrend}
            trendColorClass={incomeTrendColor}
            trendIcon={ArrowTrendingUpIcon}
          />
          <KpiCard
            title="Расходы"
            value={`${totalExpense.toFixed(2)} ${activeWorkspace?.currency || ''}`}
            icon={ArrowTrendingDownIcon}
            iconBgColor="bg-red-100 dark:bg-red-900/40"
            iconColor="text-red-500 dark:text-red-400"
            valueColor="text-red-600 dark:text-red-400"
            trendPercentage={expenseTrend}
            trendColorClass={expenseTrendColor}
            trendIcon={ArrowTrendingDownIcon}
          />
          <KpiCard
            title="Чистая прибыль"
            value={`${netProfit.toFixed(2)} ${activeWorkspace?.currency || ''}`}
            icon={ScaleIcon}
            iconBgColor={netProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-purple-100 dark:bg-purple-900/40'}
            iconColor={netProfit >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-purple-500 dark:text-purple-400'}
            valueColor={netProfitColor}
            trendPercentage={netProfitTrend}
            trendColorClass={netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}
            trendIcon={netProfit >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          />
        </div>
      )}

      {/* 5. АДАПТИРУЕМ ВИДЖЕТЫ (ГРАФИК И ТАБЛИЦЫ) */}
      <div className="mt-6 space-y-6">
        {chartData.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Тренд денежных потоков</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5, }}>
                {/* Цвет сетки для темной темы */}
                <CartesianGrid stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} strokeDasharray="3 3" />
                {/* Цвет подписей осей */}
                <XAxis dataKey="event_date_formatted" tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }} />
                <YAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }} />
                {/* Стиль тултипа */}
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB'
                  }}
                />
                <Legend wrapperStyle={{ color: theme === 'dark' ? '#D1D5DB' : '#374151' }} />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Доход" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Расход" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {latestTransactions && latestTransactions.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Последние транзакции</h3>
            <LatestTransactionsWidget transactions={latestTransactions} />
          </div>
        )}

        {ddsReport && ddsReport.items && ddsReport.items.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Расходы по статьям</h3>
            <ExpensesByDdsArticlesWidget ddsReport={ddsReport} />
          </div>
        )}

        {allTransactionsForAggregation && allTransactionsForAggregation.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Расходы по контрагентам</h3>
            <ExpensesByCounterpartiesWidget transactions={allTransactionsForAggregation} />
          </div>
        )}
      </div>

      {!data && !loading && !error && (
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
          <p>Нет данных для дашборда за выбранный период.</p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;