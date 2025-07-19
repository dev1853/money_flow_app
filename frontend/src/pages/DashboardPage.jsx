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
import TrendLineChart from '../components/dashboard/TrendLineChart';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

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
        const [summary, trend, latestTransactions, ddsReport, expensesByCounterparty] = await Promise.all([
            apiService.getDashboardSummary(params),
            apiService.getDashboardCashflowTrend({ ...params, period_type: 'day' }),
            apiService.getTransactions({ workspace_id: params.workspace_id, limit: 5, order_by: 'transaction_date desc' }),
            apiService.getDdsReport(params),
            apiService.getExpensesByCounterparties(params),
        ]);
        console.log('fetchDashboardData: summary', summary);
        console.log('fetchDashboardData: trend', trend);
        console.log('fetchDashboardData: latestTransactions', latestTransactions);
        console.log('fetchDashboardData: ddsReport', ddsReport);
        console.log('fetchDashboardData: expensesByCounterparty', expensesByCounterparty);
        return {
            summaryData: summary,
            trendData: trend,
            latestTransactions: Array.isArray(latestTransactions) ? latestTransactions : (latestTransactions?.items || []),
            ddsReportData: ddsReport,
            expensesByCounterparty: expensesByCounterparty || [],
        };
    }, [workspaceId, startDate, endDate]);

    const { data, loading, error, refetch: handleGenerateReport } = useDataFetching(
        fetchDashboardData,
        [workspaceId, startDate, endDate],
        {
            skip: authLoading || !workspaceId
        }
    );

    // Деструктуризация data ДОЛЖНА БЫТЬ ВЫШЕ useEffect!
    const { summaryData, trendData, latestTransactions, ddsReportData, expensesByCounterparty } = data || {};

    // --- Подготовка данных для PIE-диаграмм ---
    let expensesByArticle = [];
    if (Array.isArray(ddsReportData)) {
        // По статьям (только расходы)
        expensesByArticle = ddsReportData
            .filter(item => item.article_type === 'expense' && Number(item.amount) < 0)
            .map(item => ({
                article_name: item.article_name,
                total_amount: Number(item.amount),
            }));
    } else {
        // Старый вариант, если ddsReportData — объект с by_articles
        expensesByArticle = ddsReportData?.by_articles || [];
    }
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---

    useEffect(() => {
        console.log('DashboardPage: data', data);
        console.log('DashboardPage: loading', loading, 'error', error);
        console.log('DashboardPage: ddsReportData', ddsReportData);
        console.log('DashboardPage: expensesByArticle', expensesByArticle);
        console.log('DashboardPage: expensesByCounterparty', expensesByCounterparty);
    }, [data, loading, error, ddsReportData, expensesByArticle, expensesByCounterparty]);

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
        if (!trendData || !Array.isArray(trendData)) {
            return [];
        }
        return trendData
            .map((item) => {
                // Используем period или event_date
                const dateStr = item.period || item.event_date;
                let date = null;
                if (typeof dateStr === 'string' && dateStr) {
                    try {
                        date = parseISO(dateStr);
                    } catch (e) {
                        date = null;
                    }
                }
                if (!date || !isValid(date)) {
                    return null; // Пропускаем невалидные даты
                }
                return {
                    ...item,
                    event_date_formatted: format(date, 'dd MMM', { locale: ru }),
                    expense: Math.abs(Number(item.expense) || 0),
                    income: Number(item.income) || 0,
                    net_balance: Number(item.net_balance) || 0,
                };
            })
            .filter(Boolean); // Убираем null
    }, [trendData]);

    // --- СКРЫВАЕМ ОНБОРДИНГ ---
    // const [joyrideRun, setJoyrideRun] = useState(() => {
    //     try {
    //         return localStorage.getItem('onboardingJoyrideDone') !== 'true';
    //     } catch { return true; }
    // });
    // const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);
    // const joyrideSteps = [
    //     {
    //         target: '[data-tour="create-account"]',
    //         title: '💸 Добавьте счет',
    //         content: 'Нажмите здесь, чтобы добавить свой первый счет (например, карту или расчетный счет).',
    //         placement: 'bottom',
    //     },
    //     {
    //         target: '[data-tour="add-transaction"]',
    //         title: '➕ Добавьте операцию',
    //         content: 'Теперь добавьте первую операцию: доход, расход или перевод.',
    //         placement: 'bottom',
    //     },
    //     {
    //         target: '[data-tour="add-budget"]',
    //         title: '📊 Добавьте бюджет',
    //         content: 'Планируйте расходы и контролируйте исполнение бюджета.',
    //         placement: 'bottom',
    //     },
    //     {
    //         target: '[data-tour="calendar"]',
    //         title: '📅 Платежный календарь',
    //         content: 'Планируйте будущие платежи и следите за кассовыми разрывами.',
    //         placement: 'bottom',
    //     },
    //     {
    //         target: '[data-tour="dds-report"]',
    //         title: '📈 Отчет ДДС',
    //         content: 'Анализируйте движение денежных средств по статьям.',
    //         placement: 'bottom',
    //     },
    //     {
    //         target: '[data-tour="counterparties"]',
    //         title: '👥 Контрагенты',
    //         content: 'Ведите учет клиентов, поставщиков и других контрагентов.',
    //         placement: 'bottom',
    //     },
    //     {
    //         target: 'body',
    //         placement: 'center',
    //         title: '🎉 Готово!',
    //         content: 'Вы познакомились с основными возможностями. Удачи в работе!',
    //     },
    // ];
    // --- КОНЕЦ СКРЫВАНИЯ ---

    // const handleJoyrideCallback = data => {
    //     const { status, index, type } = data;
    //     if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
    //         setJoyrideRun(false);
    //         localStorage.setItem('onboardingJoyrideDone', 'true');
    //     }
    //     if (type === 'step:after') {
    //         setJoyrideStepIndex(index + 1);
    //     }
    // };

    // Кастомный рендер шага с русским счетчиком
    function CustomJoyrideTooltip(props) {
      const { step, index, size, backProps, closeProps, primaryProps, skipProps, tooltipProps, isLastStep, isFirstStep } = props;
      return (
        <div {...tooltipProps} className="rounded-2xl shadow-2xl p-6 max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400 dark:text-gray-500">Шаг {index + 1} из {size}</div>
            <button {...closeProps} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold">×</button>
          </div>
          <div className="font-bold text-xl mb-2 text-indigo-600 dark:text-indigo-400">{step.title}</div>
          <div className="mb-4 text-base">
            {typeof step.content === 'function' ? step.content() : step.content}
          </div>
          <div className="flex gap-2 justify-end">
            {skipProps && <button {...skipProps} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold">Пропустить</button>}
            {!isFirstStep && <button {...backProps} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold">Назад</button>}
            <button {...primaryProps} className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
              {isLastStep ? 'Готово' : 'Далее'}
            </button>
          </div>
        </div>
      );
    }

    // Показываем главный лоадер, пока AuthContext инициализируется
    if (authLoading) {
        return <Loader text="Инициализация приложения..." />;
    }

    // Если после загрузки нет рабочего пространства
    if (!activeWorkspace) {
        return <Alert type="info">Рабочее пространство не найдено. Пожалуйста, создайте его.</Alert>;
    }

    return (
        <div className="relative">
            {/* Круглая кнопка запуска обучения */}
            {/* <button
                className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg p-3 transition group"
                onClick={() => { setJoyrideRun(true); setJoyrideStepIndex(0); localStorage.removeItem('onboardingJoyrideDone'); }}
                title="Запустить обучение"
                aria-label="Запустить обучение"
            >
                <QuestionMarkCircleIcon className="h-7 w-7" />
                <span className="absolute bottom-14 right-0 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Обучение</span>
            </button> */}
            {/* <Joyride
                steps={joyrideSteps}
                run={joyrideRun}
                stepIndex={joyrideStepIndex}
                continuous
                showSkipButton
                showProgress
                locale={{
                    back: 'Назад',
                    close: 'Закрыть',
                    last: 'Готово',
                    next: 'Далее',
                    skip: 'Пропустить',
                    step: 'Шаг',
                }}
                styles={{
                    options: {
                        zIndex: 10000,
                        borderRadius: 16,
                        backgroundColor: 'var(--joyride-bg, #fff)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        padding: '24px 20px',
                        color: 'var(--joyride-text, #1e293b)',
                        fontSize: 16,
                        maxWidth: 400,
                    },
                    tooltipTitle: {
                        fontWeight: 700,
                        fontSize: 20,
                        marginBottom: 8,
                        color: 'var(--joyride-title, #6366f1)',
                    },
                    buttonNext: {
                        background: '#6366f1',
                        color: '#fff',
                        borderRadius: 8,
                        fontWeight: 600,
                        padding: '8px 20px',
                    },
                    buttonBack: {
                        color: '#6366f1',
                        background: 'transparent',
                        fontWeight: 600,
                    },
                    buttonSkip: {
                        color: '#64748b',
                        background: 'transparent',
                        fontWeight: 600,
                    },
                    arrow: {
                        color: '#6366f1',
                    },
                    overlay: {
                        backgroundColor: 'rgba(30, 41, 59, 0.18)',
                    },
                }}
                tooltipComponent={CustomJoyrideTooltip}
                callback={handleJoyrideCallback}
            /> */}
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
                                <TrendLineChart data={chartData} theme={theme} />
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
                <OnboardingChecklist />
            </div>
        </div>
    );
}

export default DashboardPage;