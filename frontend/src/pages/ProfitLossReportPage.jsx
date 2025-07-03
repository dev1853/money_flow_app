// frontend/src/pages/ProfitLossReportPage.jsx

import React, { useState, useMemo, useCallback } from 'react'; // Добавлен useCallback
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format } from 'date-fns';
import { getCurrentQuarterDates } from '../utils/dateUtils';
import { useDataFetching } from '../hooks/useDataFetching'; // <-- 1. Импортируем наш хук

// Компоненты UI
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsStatsCard from '../components/DdsStatsCard';

function ProfitLossReportPage() {
  const { activeWorkspace } = useAuth(); // Нам больше не нужен токен отсюда
  const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const fetchReport = useCallback(async () => {
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    // Вызываем правильный метод БЕЗ токена. Код стал чище!
    return await apiService.getProfitLossReport(
      activeWorkspace.id, 
      formattedStartDate, 
      formattedEndDate
    ); 
  }, [activeWorkspace, startDate, endDate]);

  const { 
    data: reportData, 
    loading, 
    error, 
    refetch: handleGenerateReport
  } = useDataFetching(fetchReport, [activeWorkspace, startDate, endDate], { 
    skip: !activeWorkspace || !startDate || !endDate 
  });


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6"> 
      <div className="sm:flex sm:items-center sm:flex-wrap"> 
        <div className="sm:flex-auto sm:min-w-0"> 
          <PageTitle title="Отчет ОПиУ" className="mb-6" />
        </div>
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none"> 
            <div className="p-4 bg-white rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <DatePicker label="Начало периода" selected={startDate} onChange={date => setStartDate(date)} />
                    <DatePicker label="Конец периода" selected={endDate} onChange={date => setEndDate(date)} />
                    {/* Кнопка теперь вызывает refetch из нашего хука */}
                    <Button onClick={handleGenerateReport} disabled={loading}>
                        {loading ? 'Формирование...' : 'Сформировать отчет'}
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка данных отчета..." />}

      {reportData && (
        <DdsStatsCard 
          totalIncome={reportData.total_income}
          totalExpense={reportData.total_expense}
          netProfit={reportData.net_profit}
          currency={activeWorkspace?.currency || ''} 
        />
      )}

      {reportData && (reportData.total_income === 0 && reportData.total_expense === 0) && !loading && !error && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных о прибылях и убытках за выбранный период.</p>
        </div>
      )}
    </div>
  );
}

export default ProfitLossReportPage;