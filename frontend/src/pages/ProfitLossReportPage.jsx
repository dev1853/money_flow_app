// frontend/src/pages/ProfitLossReportPage.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format } from 'date-fns';
import { getCurrentQuarterDates } from '../utils/dateUtils';
import { useDataFetching } from '../hooks/useDataFetching';

// Компоненты UI
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsStatsCard from '../components/DdsStatsCard';

function ProfitLossReportPage() {
  const { activeWorkspace } = useAuth();
  const { startDate: initialStartDate, endDate: initialEndDate } = useMemo(getCurrentQuarterDates, []);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const fetchReport = useCallback(async () => {
    if (!activeWorkspace || !activeWorkspace.id || !startDate || !endDate) {
      return null;
    }

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    return await apiService.getProfitLossReport({
      workspace_id: activeWorkspace.id,
      start_date: formattedStartDate,
      end_date: formattedEndDate
    });
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
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? 'Формирование...' : 'Сформировать отчет'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка данных отчета..." />}

      {/* ИСПРАВЛЕНО: Добавлены parseFloat и значения по умолчанию для числовых пропсов */}
      {reportData && (
        <DdsStatsCard
          totalIncome={parseFloat(reportData.total_income) || 0}
          totalExpense={parseFloat(reportData.total_expense) || 0}
          netProfit={parseFloat(reportData.net_profit) || 0}
          currency={activeWorkspace?.currency || ''}
        />
      )}

      {/* ИСПРАВЛЕНО: Условие отображения сообщения об отсутствии данных */}
      {reportData &&
        (parseFloat(reportData.total_income) || 0) === 0 &&
        (parseFloat(reportData.total_expense) || 0) === 0 &&
        !loading &&
        !error && (
          <div className="mt-6 text-center text-gray-500">
            <p>Нет данных о прибылях и убытках за выбранный период.</p>
          </div>
        )}
    </div>
  );
}

export default ProfitLossReportPage;