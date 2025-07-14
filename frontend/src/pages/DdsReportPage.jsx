// frontend/src/pages/DdsReportPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format } from 'date-fns';
import { getCurrentQuarterDates } from '../utils/dateUtils';
import { useDataFetching } from '../hooks/useDataFetching';

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

  const initialDates = useMemo(getCurrentQuarterDates, []);
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  const [showDrilldownModal, setShowDrilldownModal] = useState(false);
  const [drilldownArticle, setDrilldownArticle] = useState(null);

  const fetchDdsReport = useCallback(async () => {
    if (!activeWorkspace || !activeWorkspace.id || !startDate || !endDate) {
      return []; // Возвращаем пустой массив, если данные не готовы
    }

    const params = {
      workspace_id: activeWorkspace.id,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    };

    let data = (await apiService.getDdsReport(params));
    if (!Array.isArray(data)) {
        data = [];
    }

    // ИСПРАВЛЕНО: Расширенная фильтрация - скрывать строку, если ВСЕ числовые поля равны нулю
    return data.filter(item => {
        const initialBalance = parseFloat(item.initial_balance) || 0;
        const turnover = parseFloat(item.turnover) || 0;
        const finalBalance = parseFloat(item.final_balance) || 0;
        const amount = parseFloat(item.amount) || 0; // amount часто дублирует turnover, но проверяем его на всякий случай
        const percentageOfTotal = parseFloat(item.percentage_of_total) || 0;

        // Строка отображается, если хотя бы одно из этих полей не равно нулю
        return !(initialBalance === 0 && turnover === 0 && finalBalance === 0 && amount === 0 && percentageOfTotal === 0);
    });
  }, [activeWorkspace, startDate, endDate]);


  const {
    data: reportData,
    loading,
    error,
    refetch: handleGenerateReport
  } = useDataFetching(fetchDdsReport, [activeWorkspace, startDate, endDate], {
    skip: !activeWorkspace || !startDate || !endDate
  });

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    if (reportData && reportData.length > 0) {
      reportData.forEach(item => {
        if (item.article_type === 'income') {
          income += parseFloat(item.turnover) || 0;
        } else if (item.article_type === 'expense') {
          expense += Math.abs(parseFloat(item.turnover)) || 0;
        }
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
    <div className="px-4 sm:px-6 lg:px-8 py-6 dark:text-gray-200">
      <div className="sm:flex sm:items-center sm:flex-wrap">
        <PageTitle title="Отчет ДДС" className="mb-6" />
        <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
      {loading && <Loader text="Загрузка данных отчета..." />}

      {reportData && (
        <DdsStatsCard
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netProfit={netProfit}
          currency={activeWorkspace?.currency || ''}
        />
      )}

      {reportData && !loading && !error && (
        <DdsReportTable
          data={Array.isArray(reportData) ? reportData : []}
          onArticleClick={handleArticleDrilldown}
        />
      )}

      {(reportData === null || (Array.isArray(reportData) && reportData.length === 0)) && !loading && !error && (
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
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