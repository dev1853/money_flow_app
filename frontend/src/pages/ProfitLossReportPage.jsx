// frontend/src/pages/ProfitLossReportPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, endOfMonth, startOfMonth } from 'date-fns';

// Компоненты UI
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsStatsCard from '../components/DdsStatsCard'; // Переиспользуем компонент для отображения итогов


// Вспомогательная функция для получения начала и конца текущего квартала (переиспользована из DdsReportPage)
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


function ProfitLossReportPage() {
  const { activeWorkspace } = useAuth();

  const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);

  // Состояния для фильтров, данных и UI
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [reportData, setReportData] = useState(null); // Здесь будет ProfitLossReport объект
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleGenerateReport = async () => {
    if (!activeWorkspace || !startDate || !endDate) {
      setError("Пожалуйста, выберите рабочее пространство и укажите полный период.");
      return;
    }
    setLoading(true);
    setError('');
    setReportData(null); 

    try {
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      // ОТЛИЧИЕ ОТ ДДС: Запрашиваем данные по новому эндпоинту для ОПиУ
      const data = await apiService.get(`/reports/pnl?${params.toString()}`);
      setReportData(data); // data будет уже ProfitLossReport объектом
      
    } catch (err) {
      setError(err.message || "Не удалось сформировать отчет.");
      console.error("Ошибка формирования ОПиУ:", err);
    } finally {
      setLoading(false);
    }
  };

  // Автоматически формируем отчет при загрузке страницы
  useEffect(() => {
    if (activeWorkspace) {
      handleGenerateReport();
    }
  }, [activeWorkspace, startDate, endDate]); // Переформировывать при изменении workspace или дат


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6"> 
      {/* Секция заголовка и фильтров (аналогично DdsReportPage) */}
      <div className="sm:flex sm:items-center sm:flex-wrap"> 
        <div className="sm:flex-auto sm:min-w-0"> 
          <PageTitle title="Отчет ОПиУ" className="mb-6" />
        </div>
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none"> 
            <div className="p-4 bg-white rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <DatePicker label="Начало периода" selected={startDate} onChange={date => setStartDate(date)} />
                    <DatePicker label="Конец периода" selected={endDate} onChange={date => setEndDate(date)} />
                    <Button onClick={handleGenerateReport} disabled={loading}>
                        {loading ? 'Формирование...' : 'Сформировать отчет'}
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка данных отчета..." />}

      {/* Блок ИТОГО (переиспользуем DdsStatsCard) */}
      {reportData && ( // Показываем DdsStatsCard, если reportData не null
        <DdsStatsCard 
          totalIncome={reportData.total_income}  // <--- Используем данные из reportData
          totalExpense={reportData.total_expense} // <--- Используем данные из reportData
          netProfit={reportData.net_profit}     // <--- Используем данные из reportData
          currency={activeWorkspace?.currency || ''} 
        />
      )}

      {/* Если данных нет */}
      {reportData && (reportData.total_income === 0 && reportData.total_expense === 0) && !loading && !error && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных о прибылях и убытках за выбранный период.</p>
        </div>
      )}
    </div>
  );
}

export default ProfitLossReportPage;