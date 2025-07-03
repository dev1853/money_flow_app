// frontend/src/pages/DashboardPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
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
import DdsStatsCard from '../components/DdsStatsCard'; 

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
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    const [summary, trend] = await Promise.all([
      apiService.getDashboardSummary(activeWorkspace.id, formattedStartDate, formattedEndDate),
      apiService.getDashboardCashflowTrend(activeWorkspace.id, formattedStartDate, formattedEndDate, 'day')
    ]);
    return { summaryData: summary, trendData: trend };
  }, [activeWorkspace, startDate, endDate]);

  const { data, loading, error, refetch: handleGenerateReport } = useDataFetching(
    fetchDashboardData,
    [activeWorkspace, startDate,endDate],
    { skip: !activeWorkspace || !startDate || !endDate }
  );

  const summaryData = data?.summaryData;
  const trendData = data?.trendData;

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    const summary = summaryData?.summary_by_currency?.[0];

    // Преобразуем строки в числа с помощью parseFloat
    return {
      totalIncome: parseFloat(summary?.total_income) || 0,
      totalExpense: parseFloat(summary?.total_expense) || 0,
      netProfit: parseFloat(summary?.net_balance) || 0,
    };
  }, [summaryData]);

  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    
    return trendData.map(item => {
        const income = parseFloat(item.total_income) || 0;
        const expense = parseFloat(item.total_expense) || 0;
        
        // 1. Парсим полную дату (ожидаем "YYYY-MM-DD")
        const date = parseISO(item.period);
        
        // 2. Форматируем ее в виде "День Месяц" (напр. "26 июн")
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

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка данных дашборда..." />}

      {/* Используем summaryData с опциональной цепочкой на случай, если data еще null */}
      {summaryData && !loading && ( 
        <DdsStatsCard 
          totalIncome={totalIncome} 
          totalExpense={totalExpense} 
          netProfit={netProfit} 
          currency={activeWorkspace?.currency || ''} 
        />
      )}

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
      
      {!data && !loading && !error && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных для дашборда за выбранный период.</p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;