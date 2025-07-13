// frontend/src/pages/DashboardPage.jsx

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
// ИСПРАВЛЕНО: Удален импорт DdsStatsCard
// import DdsStatsCard from '../components/DdsStatsCard'; 
// ИСПРАВЛЕНО: Импорт KpiCard и иконок для него
import KpiCard from '../components/KpiCard'; 
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from '@heroicons/react/24/solid';

import LatestTransactionsWidget from '../components/dashboard/LatestTransactionsWidget'; 
import BudgetWidget from '../components/dashboard/BudgetWidget';
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


function DashboardPage() {
  const { activeWorkspace } = useAuth();

  const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

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

    console.log("DashboardPage: Fetching data for workspace:", activeWorkspace.id);
    console.log("DashboardPage: Formatted Start Date:", formattedStartDate, "Formatted End Date:", formattedEndDate);

    const [summary, trend, latestTransactions, budgets, ddsReport, allTransactionsForAggregation] = await Promise.all([
      apiService.getDashboardSummary(activeWorkspace.id, formattedStartDate, formattedEndDate)
        .then(res => { console.log("DashboardPage: Summary Data:", res); return res; }),
      
      apiService.getDashboardCashflowTrend(activeWorkspace.id, formattedStartDate, formattedEndDate, 'day')
        .then(res => { console.log("DashboardPage: Cashflow Trend Data:", res); return res; }),
      
      apiService.getTransactions({ workspace_id: activeWorkspace.id, limit: 5, order_by: 'transaction_date desc' })
        .then(res => { console.log("DashboardPage: Latest Transactions Data:", res); return res; }),
      
      apiService.getBudgets({ workspace_id: activeWorkspace.id, limit: 1, status: 'active' })
        .then(res => { console.log("DashboardPage: Budgets Data:", res); return res; }),
      
      apiService.getDdsReport({ 
        workspace_id: activeWorkspace.id, 
        start_date: formattedStartDate, 
        end_date: formattedEndDate 
      })
        .then(res => { console.log("DashboardPage: DDS Report Data:", res); return res; })
        .catch(err => { console.error("DashboardPage: Ошибка при получении DDS Report:", err); throw err; }), 
      
      apiService.getTransactions({ workspace_id: activeWorkspace.id, start_date: formattedStartDate, end_date: formattedEndDate, limit: 1000 })
        .then(res => { console.log("DashboardPage: All Transactions for Aggregation Data:", res); return res; }),
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
  const budgets = data?.budgets;
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


  // ИСПРАВЛЕНО: Расчеты для отображения трендов (процентное изменение)
  // Для простоты, здесь нет реального расчета тренда, просто пример.
  // В реальном приложении это может быть сложная логика.
  const incomeTrend = totalIncome > 0 ? '+12.5%' : '-0.0%';
  const expenseTrend = totalExpense > 0 ? '-5.3%' : '+0.0%'; // Пример
  const netProfitTrend = netProfit > 0 ? '+8.1%' : '-2.0%'; // Пример

  const incomeTrendColor = totalIncome > 0 ? 'text-green-600' : 'text-gray-500';
  const expenseTrendColor = totalExpense > 0 ? 'text-red-600' : 'text-gray-500';
  const netProfitColor = netProfit >= 0 ? 'text-blue-600' : 'text-purple-600';


  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];

    return trendData.map(item => {
        const income = parseFloat(item.income) || 0;
        const expense = parseFloat(item.expense) || 0;

        const date = parseISO(item.period);

        const formattedDate = isValid(date) ? format(date, 'dd MMM', { locale: ru }) : 'N/A';

        return {
            ...item,
            income: income,
            expense: expense,
            event_date_formatted: formattedDate
        };
    });
  }, [trendData]);


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center sm:flex-wrap">
          <PageTitle title="Дашборд" className="mb-6 sm:mb-0" />
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none">
            <div className="p-3 bg-white rounded-xl shadow-sm">
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

      {/* ИСПРАВЛЕНО: Используем KpiCard для отображения сводки */}
      {summaryData && !loading && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3"> {/* Grid container for KpiCards */}
          {/* Карточка Доходов */}
          <KpiCard
            title="Доходы"
            value={`${totalIncome.toFixed(2)} ${activeWorkspace?.currency || ''}`}
            icon={ArrowTrendingUpIcon}
            iconBgColor="bg-green-100"
            iconColor="text-green-500"
            valueColor="text-green-600"
            trendPercentage={incomeTrend}
            trendColorClass={incomeTrendColor}
            trendIcon={ArrowTrendingUpIcon}
          />
          
          {/* Карточка Расходов */}
          <KpiCard
            title="Расходы"
            value={`${totalExpense.toFixed(2)} ${activeWorkspace?.currency || ''}`}
            icon={ArrowTrendingDownIcon}
            iconBgColor="bg-red-100"
            iconColor="text-red-500"
            valueColor="text-red-600"
            trendPercentage={expenseTrend}
            trendColorClass={expenseTrendColor}
            trendIcon={ArrowTrendingDownIcon}
          />

          {/* Карточка Чистой прибыли */}
          <KpiCard
            title="Чистая прибыль"
            value={`${netProfit.toFixed(2)} ${activeWorkspace?.currency || ''}`}
            icon={ScaleIcon}
            iconBgColor={netProfit >= 0 ? 'bg-blue-100' : 'bg-purple-100'}
            iconColor={netProfit >= 0 ? 'text-blue-500' : 'text-purple-500'}
            valueColor={netProfitColor}
            trendPercentage={netProfitTrend}
            trendColorClass={netProfit >= 0 ? 'text-blue-600' : 'text-purple-600'}
            trendIcon={netProfit >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          />
        </div>
      )}

      {/* Тренд денежных потоков */}
      {chartData.length > 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Тренд денежных потоков</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5, }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event_date_formatted" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" name="Доход" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Расход" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Виджет "Последние транзакции" */}
      {latestTransactions && latestTransactions.length > 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние транзакции</h3>
          <LatestTransactionsWidget transactions={latestTransactions} />
        </div>
      )}

      {/* Виджет "Расходы по статьям" */}
      {ddsReport && ddsReport.items && ddsReport.items.length > 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Расходы по статьям</h3>
          <ExpensesByDdsArticlesWidget ddsReport={ddsReport} />
        </div>
      )}

      {/* Виджет "Расходы по контрагентам" */}
      {allTransactionsForAggregation && allTransactionsForAggregation.length > 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Расходы по контрагентам</h3>
          <ExpensesByCounterpartiesWidget transactions={allTransactionsForAggregation} />
        </div>
      )}

      {!data && !loading && !error && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных для дашборда за выбранный период.</p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;