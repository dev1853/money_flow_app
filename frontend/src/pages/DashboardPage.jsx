// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Добавлен useCallback
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, endOfMonth, startOfMonth, parseISO } from 'date-fns'; 
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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // <--- НОВЫЕ ИМПОРТЫ


// Вспомогательная функция для получения начала и конца текущего квартала
const getCurrentQuarterDates = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); 
  const currentYear = now.getFullYear();

  let quarterStartMonth;
  if (currentMonth >= 0 && currentMonth <= 2) { 
    quarterStartMonth = 0;
  } else if (currentMonth >= 3 && currentMonth <= 5) { 
    quarterStartMonth = 3;
  } else if (currentMonth >= 6 && currentMonth <= 8) { 
    quarterStartMonth = 6;
  } else { 
    quarterStartMonth = 9;
  }

  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = endOfMonth(new Date(currentYear, quarterStartMonth + 2)); 

  return { startDate, endDate };
};


function DashboardPage() {
  const { activeWorkspace } = useAuth();

  const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [summaryData, setSummaryData] = useState(null); 
  const [trendData, setTrendData] = useState(null);   
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Оборачиваем handleGenerateReport в useCallback, чтобы она не пересоздавалась
  const handleGenerateReport = useCallback(async () => {
    console.log("DEBUG(Dashboard): handleGenerateReport called."); // <--- ЛОГ
    console.log("DEBUG(Dashboard): Current startDate:", startDate, "endDate:", endDate); // <--- ЛОГ
    
    if (!activeWorkspace || !activeWorkspace.id) {
      setError("Пожалуйста, выберите рабочее пространство.");
      return;
    }
    setLoading(true);
    setError('');
    setSummaryData(null); 
    setTrendData(null); 

    try {
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      const summaryUrl = `/dashboard/summary?${params.toString()}`; // <--- ЛОГ
      const trendUrl = `/dashboard/cashflow-trend?${params.toString()}&interval=day`; // <--- ЛОГ
      
      console.log("DEBUG(Dashboard): Fetching summary from URL:", summaryUrl); // <--- ЛОГ
      const fetchedSummaryData = await apiService.get(summaryUrl); 
      setSummaryData(fetchedSummaryData);
      console.log("DEBUG(Dashboard): Fetched summary data:", fetchedSummaryData); // <--- ЛОГ

      console.log("DEBUG(Dashboard): Fetching trend from URL:", trendUrl); // <--- ЛОГ
      const fetchedTrendData = await apiService.get(trendUrl);
      setTrendData(fetchedTrendData); 
      console.log("DEBUG(Dashboard): Fetched trend data:", fetchedTrendData); // <--- ЛОГ

    } catch (err) {
      setError(err.message || "Не удалось загрузить данные дашборда.");
      console.error("DEBUG(Dashboard): Ошибка загрузки данных дашборда:", err); // <--- ЛОГ
    } finally {
      setLoading(false);
      console.log("DEBUG(Dashboard): handleGenerateReport finished."); // <--- ЛОГ
    }
  }, [activeWorkspace, startDate, endDate]); // <--- Зависимости для useCallback


  useEffect(() => {
    console.log("DEBUG(Dashboard): useEffect for data fetch mounted/updated."); // <--- ЛОГ
    if (activeWorkspace) {
      handleGenerateReport(); 
    }
  }, [activeWorkspace, startDate, endDate, handleGenerateReport]); // <--- Зависимости для useEffect


  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    return {
      totalIncome: summaryData?.total_income || 0,
      totalExpense: summaryData?.total_expense || 0,
      netProfit: summaryData?.net_profit || 0,
    };
  }, [summaryData]);

  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map(item => ({
      ...item,
      event_date_formatted: format(parseISO(item.event_date), 'dd.MM', { locale: ru }),
    }));
  }, [trendData]);


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6"> 
      {/* Секция заголовка и фильтров */}
      <div className="sm:flex sm:items-center sm:flex-wrap"> 
        <div className="sm:flex-auto sm:min-w-0 mb-4 sm:mb-0"> 
          <PageTitle title="Дашборд" className="mb-6" />
        </div>
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none"> 
            <div className="p-4 bg-white rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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

      {/* Блок сводной статистики (KPI) */}
      {summaryData && ( 
        <DdsStatsCard 
          totalIncome={totalIncome} 
          totalExpense={totalExpense} 
          netProfit={netProfit} 
          currency={activeWorkspace?.currency || ''} 
        />
      )}

      {/* Блок тренда денежных потоков с графиком Recharts */}
      {chartData.length > 0 && !loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Тренд денежных потоков</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
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

      {/* Если данных нет */}
      {!loading && !error && (!summaryData && !trendData) && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных для дашборда за выбранный период. Попробуйте добавить транзакции.</p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;