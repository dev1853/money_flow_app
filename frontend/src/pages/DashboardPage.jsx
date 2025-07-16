import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO, isValid } from 'date-fns';
import { useDataFetching } from '../hooks/useDataFetching';
import { getCurrentQuarterDates } from '../utils/dateUtils';
import { ru } from 'date-fns/locale';

// Иконки и компоненты
import { ArrowUpCircle, ArrowDownCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import KpiCard from '../components/KpiCard';
import LatestTransactionsWidget from '../components/dashboard/LatestTransactionsWidget';
import ExpensesByDdsArticlesWidget from '../components/dashboard/ExpensesByDdsArticlesWidget';
import ExpensesByCounterpartiesWidget from '../components/dashboard/ExpensesByCounterpartiesWidget';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

function safeSplit(str, delimiter) {
  return typeof str === 'string' ? str.split(delimiter) : [];
}

function DashboardPage() {
    const { activeWorkspace, loading: authLoading } = useAuth();
    const workspaceId = activeWorkspace?.id; // Явно извлекаем ID
    const { theme } = useTheme();

    const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    useEffect(() => {
        console.log('DashboardPage: activeWorkspace', activeWorkspace);
        console.log('DashboardPage: workspaceId', workspaceId);
        console.log('DashboardPage: startDate', startDate, 'endDate', endDate);
    }, [activeWorkspace, workspaceId, startDate, endDate]);

    const fetchDashboardData = useCallback(async () => {
        if (!workspaceId) {
            console.log('fetchDashboardData: workspaceId отсутствует');
            return null;
        }
        const params = {
            workspace_id: workspaceId,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
        };
        console.log('fetchDashboardData: params', params);
        const [summary, trend, latestTransactions, ddsReport] = await Promise.all([
            apiService.getDashboardSummary(params),
            apiService.getDashboardCashflowTrend({ ...params, period_type: 'day' }),
            apiService.getTransactions({ workspace_id: params.workspace_id, limit: 5, order_by: 'transaction_date desc' }),
            apiService.getDdsReport(params),
        ]);
        console.log('fetchDashboardData: summary', summary);
        console.log('fetchDashboardData: trend', trend);
        console.log('fetchDashboardData: latestTransactions', latestTransactions);
        console.log('fetchDashboardData: ddsReport', ddsReport);
        return {
            summaryData: summary,
            trendData: trend,
            latestTransactions: Array.isArray(latestTransactions) ? latestTransactions : (latestTransactions?.items || []),
            ddsReportData: ddsReport,
        };
    }, [workspaceId, startDate, endDate]);

    const { data, loading, error, refetch: handleGenerateReport } = useDataFetching(
        fetchDashboardData,
        [workspaceId, startDate, endDate],
        {
            skip: authLoading || !workspaceId
        }
    );

    useEffect(() => {
        console.log('DashboardPage: data', data);
        console.log('DashboardPage: loading', loading, 'error', error);
    }, [data, loading, error]);

    const { summaryData, trendData, latestTransactions, ddsReportData } = data || {};
    const { totalIncome, totalExpense, netProfit } = useMemo(() => {
        console.log('summaryData для useMemo:', summaryData);
        if (!summaryData || !Array.isArray(summaryData.summary_by_currency) || summaryData.summary_by_currency.length === 0) {
            return { totalIncome: 0, totalExpense: 0, netProfit: 0 };
        }
        const currencySummary = summaryData.summary_by_currency[0];
        return {
            totalIncome: currencySummary.total_income || 0,
            totalExpense: currencySummary.total_expense || 0,
            netProfit: currencySummary.net_balance || 0, // если нужен net_balance
        };
    }, [summaryData]);

    const chartData = useMemo(() => {
        console.log('trendData для useMemo:', trendData);
        if (!trendData || !Array.isArray(trendData)) {
            console.log('trendData пустой или не массив');
            return [];
        }
        return trendData.map((item, idx) => {
            console.log('trendData item', idx, item);
            const safeDate = typeof item.event_date === 'string' && item.event_date ? item.event_date : null;
            console.log('trendData item.event_date:', item.event_date, 'safeDate:', safeDate);
            let date = null;
            if (safeDate) {
                try {
                    date = parseISO(safeDate);
                    console.log('trendData parseISO result:', date);
                } catch (e) {
                    console.error('trendData parseISO error:', e, 'safeDate:', safeDate);
                }
            }
            return {
                ...item,
                event_date_formatted: (date && isValid(date)) ? format(date, 'dd MMM', { locale: ru }) : 'Неверная дата',
                expense: Math.abs(item.expense || 0)
            };
        });
    }, [trendData]);

    const expensesByArticle = ddsReportData?.by_articles || [];
    const expensesByCounterparty = ddsReportData?.by_counterparties || [];

    

    // Показываем главный лоадер, пока AuthContext инициализируется
    if (authLoading) {
        return <Loader text="Инициализация приложения..." />;
    }

    // Если после загрузки нет рабочего пространства
    if (!activeWorkspace) {
        return <Alert type="info">Рабочее пространство не найдено. Пожалуйста, создайте его.</Alert>;
    }

    return (
        <div className="text-gray-900 dark:text-gray-200">
            <div className="sm:flex sm:items-center sm:flex-wrap">
                <PageTitle title="Дашборд" />
                <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                            <DatePicker label="Начало периода" selected={startDate} onChange={setStartDate} />
                            <DatePicker label="Конец периода" selected={endDate} onChange={setEndDate} />
                            <Button onClick={handleGenerateReport} disabled={loading}>
                                {loading ? 'Обновление...' : 'Обновить'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <Alert type="error" className="my-4">{error.message}</Alert>}
            {loading && <Loader text="Загрузка данных дашборда..." />}

            {!loading && data && (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <KpiCard 
                            title="Доходы" 
                            value={`${totalIncome.toLocaleString('ru-RU')} ₽`} 
                            icon={ArrowUpCircle} 
                            iconBgColor="bg-green-100 dark:bg-green-900/40" 
                            iconColor="text-green-500 dark:text-green-400" 
                        />
                        
                        <KpiCard 
                            title="Расходы" 
                            value={`${Math.abs(totalExpense).toLocaleString('ru-RU')} ₽`} 
                            icon={ArrowDownCircle} 
                            iconBgColor="bg-red-100 dark:bg-red-900/40" 
                            iconColor="text-red-500 dark:text-red-400" 
                        />
                        
                        <KpiCard 
                            title="Чистый поток" 
                            value={`${netProfit.toLocaleString('ru-RU')} ₽`} 
                            icon={DollarSign} 
                            iconBgColor={netProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-purple-100 dark:bg-purple-900/40'} 
                            iconColor={netProfit >= 0 ? 'text-blue-500' : 'text-purple-500'} 
                            trendIcon={netProfit >= 0 ? TrendingUp : TrendingDown} 
                        />
                    </div>


                    <div className="mt-6 space-y-6">
                        {chartData.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Тренд денежных потоков</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                                        <XAxis dataKey="event_date_formatted" tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }} />
                                        <YAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }} />
                                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="income" stroke="#10B981" name="Доход" />
                                        <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Расход" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <ExpensesByDdsArticlesWidget data={expensesByArticle} isLoading={loading} />
                            <ExpensesByCounterpartiesWidget data={expensesByCounterparty} isLoading={loading} />
                        </div>

                        {latestTransactions?.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Последние транзакции</h3>
                                <LatestTransactionsWidget transactions={latestTransactions} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardPage;