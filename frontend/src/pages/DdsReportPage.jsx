// frontend/src/pages/DdsReportPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format } from 'date-fns';

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsReportTable from '../components/DdsReportTable';

function DdsReportPage() {
  const { activeWorkspace } = useAuth();
  
  // Состояния для фильтров, данных и UI
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
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
      const data = await apiService.get(`/reports/dds?${params.toString()}`);
      setReportData(data);
    } catch (err) {
      setError(err.message || "Не удалось сформировать отчет");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageTitle title="Отчет о Движении Денежных Средств (ДДС)" />
      
      <div className="p-4 bg-white rounded-xl shadow-sm my-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <DatePicker label="Начало периода" selected={startDate} onChange={date => setStartDate(date)} />
          <DatePicker label="Конец периода" selected={endDate} onChange={date => setEndDate(date)} />
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? 'Формирование...' : 'Сформировать отчет'}
          </Button>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      
      {loading && <Loader text="Загрузка данных отчета..." />}

      {reportData && reportData.length > 0 && <DdsReportTable data={reportData} />}
      
      {reportData && reportData.length === 0 && (
        <div className="mt-6 text-center text-gray-500">
            <p>За выбранный период нет данных для построения отчета.</p>
        </div>
      )}
    </div>
  );
}

export default DdsReportPage;