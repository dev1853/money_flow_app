// frontend/src/pages/DdsReportPage.jsx
import React, { useState, useMemo, useCallback } from 'react'; // 1. Импортируем хуки
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format } from 'date-fns'; 
import { getCurrentQuarterDates } from '../utils/dateUtils';
import { useDataFetching } from '../hooks/useDataFetching'; // Наш главный помощник

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsReportTable from '../components/DdsReportTable';
import Modal from '../components/Modal';
import TransactionsListForDdsArticle from '../components/TransactionsListForDdsArticle';
import DdsStatsCard from '../components/DdsStatsCard';

function DdsReportPage() {
  const { activeWorkspace } = useAuth();

  const initialDates = getCurrentQuarterDates();
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  
  // Состояния для детализации транзакций (остаются без изменений)
  const [showDrilldownModal, setShowDrilldownModal] = useState(false);
  const [drilldownArticle, setDrilldownArticle] = useState(null); 

  // 2. Определяем функцию запроса для хука
  const fetchDdsReport = useCallback(async () => {
    const params = {
      workspace_id: activeWorkspace.id,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    };
    // Используем правильный метод из apiService
    const data = await apiService.getDdsReport(params.workspace_id, params.start_date, params.end_date);
    
    // Фильтрация данных остается здесь, т.к. это бизнес-логика этого отчета
    return data.filter(item => item.income !== 0 || item.expense !== 0 || (item.children && item.children.length > 0));
  }, [activeWorkspace, startDate, endDate]);

  // 3. Вызываем наш хук одной строкой!
  const {
    data: reportData,
    loading,
    error,
    refetch: handleGenerateReport
  } = useDataFetching(fetchDdsReport, [activeWorkspace, startDate, endDate], {
    skip: !activeWorkspace || !startDate || !endDate
  });

  // --- Код ниже почти не меняется ---

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    if (reportData && reportData.length > 0) {
      reportData.forEach(item => {
        income += item.income || 0;
        expense += item.expense || 0;
      });
    }
    return { totalIncome: income, totalExpense: expense, netProfit: income - expense };
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
      <div className="sm:flex sm:items-center sm:flex-wrap"> 
        <PageTitle title="Отчет ДДС" className="mb-6" />
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none"> 
            <div className="p-3 bg-white rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                    <DatePicker label="Начало периода" selected={startDate} onChange={date => setStartDate(date)} />
                    <DatePicker label="Конец периода" selected={endDate} onChange={date => setEndDate(date)} />
                    {/* Кнопка теперь вызывает refetch из хука */}
                    <Button onClick={handleGenerateReport} disabled={loading}>
                        {loading ? 'Загрузка...' : 'Обновить'}
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка данных отчета..." />}

      {reportData && (
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