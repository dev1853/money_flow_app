// frontend/src/pages/DdsReportPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, endOfMonth, startOfMonth } from 'date-fns'; 

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsReportTable from '../components/DdsReportTable';
import Modal from '../components/Modal';
import TransactionsListForDdsArticle from '../components/TransactionsListForDdsArticle';
// НОВЫЙ ИМПОРТ: Компонент для статистики
import DdsStatsCard from '../components/DdsStatsCard'; // <--- НОВЫЙ ИМПОРТ

// Вспомогательная функция для получения начала и конца текущего квартала
const getCurrentQuarterDates = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const currentYear = now.getFullYear();

  let quarterStartMonth;
  if (currentMonth >= 0 && currentMonth <= 2) { // Q1: Jan-Mar
    quarterStartMonth = 0;
  } else if (currentMonth >= 3 && currentMonth <= 5) { // Q2: Apr-Jun
    quarterStartMonth = 3;
  } else if (currentMonth >= 6 && currentMonth <= 8) { // Q3: Jul-Sep
    quarterStartMonth = 6;
  } else { // Q4: Oct-Dec
    quarterStartMonth = 9;
  }

  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = endOfMonth(new Date(currentYear, quarterStartMonth + 2)); // Конец 3-го месяца квартала

  return { startDate, endDate };
};

function DdsReportPage() {
  const { activeWorkspace } = useAuth();

  // Состояния для фильтров, данных и UI
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Состояния для детализации транзакций
  const [showDrilldownModal, setShowDrilldownModal] = useState(false);
  const [drilldownArticle, setDrilldownArticle] = useState(null); 


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
      const data = await apiService.get(`/reports/dds?${params.toString()}`);
      
      const filteredData = data.filter(item => item.income !== 0 || item.expense !== 0 || (item.children && item.children.length > 0));
      setReportData(filteredData);
      
    } catch (err) {
      setError(err.message || "Не удалось сформировать отчет");
    } finally {
      setLoading(false);
    }
  };

  // НОВОЕ: Автоматически формируем отчет при загрузке страницы
  useEffect(() => {
    if (activeWorkspace) { // Убедимся, что рабочее пространство активно
      handleGenerateReport();
    }
  }, [activeWorkspace, startDate, endDate]);

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;

    if (reportData && reportData.length > 0) {
      reportData.forEach(item => {
        income += item.income || 0;
        expense += item.expense || 0;
      });
    }
    const profit = income - expense;
    return { totalIncome: income, totalExpense: expense, netProfit: profit };
  }, [reportData]);

  const handleArticleDrilldown = (articleId, articleName, articleType) => {
    setDrilldownArticle({ id: articleId, name: articleName, type: articleType });
    setShowDrilldownModal(true);
  };

  const handleCloseDrilldownModal = () => {
    setShowDrilldownModal(false);
    setDrilldownArticle(null);
  };


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6"> 

      {/* Блок фильтров - теперь отдельный блок, всегда на всю ширину */}
      <div className="sm:flex sm:items-center sm:flex-wrap"> 
          <PageTitle title="Отчет ДДС" className="mb-6" />
        {/* ИЗМЕНЕНО: Отступы и отступы сетки для компактности */}
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none"> 
            <div className="p-3 bg-white rounded-xl shadow-sm"> {/* <--- ИЗМЕНЕНО: p-3 вместо p-4 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 items-end"> {/* <--- ИЗМЕНЕНО: gap-x-3 gap-y-2 вместо gap-4 */}
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
      {loading && <Loader text="Загрузка данных отчета..." />}

      {reportData && ( // Показываем DdsStatsCard, если reportData не null
        <DdsStatsCard 
          totalIncome={totalIncome} 
          totalExpense={totalExpense} 
          netProfit={netProfit} 
          currency={activeWorkspace?.currency || ''} 
        />
      )}

      {reportData && reportData.length > 0 && !loading && !error && (
        <DdsReportTable 
          data={reportData} 
          onArticleClick={handleArticleDrilldown} 
        />
      )}

      {reportData && reportData.length === 0 && !loading && !error && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных для выбранного периода.</p>
        </div>
      )}

      {/* Модальное окно детализации транзакций */}
      <Modal 
        isOpen={showDrilldownModal} 
        onClose={handleCloseDrilldownModal} 
        title={`Детализация: ${drilldownArticle?.name}`}
        maxWidth="max-w-4xl" 
      >
        {drilldownArticle && (
          <TransactionsListForDdsArticle
            articleId={drilldownArticle.id}
            articleName={drilldownArticle.name}
            startDate={startDate}
            endDate={endDate}
            onClose={handleCloseDrilldownModal}
          />
        )}
      </Modal>
    </div>
  );
}

export default DdsReportPage;