// frontend/src/pages/DdsReportPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format } from 'date-fns';

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import DatePicker from '../components/forms/DatePicker';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import DdsReportTable from '../components/DdsReportTable'; // <--- Убедитесь, что это импорт компонента, а не его код


function DdsReportPage() {
  const { activeWorkspace } = useAuth();

  // Состояния для фильтров, данных и UI
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null); // reportData все еще null по умолчанию
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    if (!activeWorkspace || !startDate || !endDate) {
      setError("Пожалуйста, выберите рабочее пространство и укажите полный период.");
      return;
    }
    setLoading(true);
    setError('');
    setReportData(null); // Очищаем данные перед новым запросом

    try {
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      const data = await apiService.get(`/reports/dds?${params.toString()}`);
      
      // Здесь данные фильтруются для отображения только статей с транзакциями
      const filteredData = data.filter(item => item.income !== 0 || item.expense !== 0 || (item.children && item.children.length > 0));
      setReportData(filteredData); // Устанавливаем уже отфильтрованные данные
      
    } catch (err) {
      setError(err.message || "Не удалось сформировать отчет");
    } finally {
      setLoading(false);
    }
  };

  // Расчет итоговых значений ДДС (для блока "ИТОГО" на этой странице)
  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;

    // Итерируем по reportData (который уже отфильтрован по ненулевым статьям, но все равно может быть null)
    if (reportData && reportData.length > 0) {
      reportData.forEach(item => {
        income += item.income || 0;
        expense += item.expense || 0;
      });
    }
    const profit = income - expense;
    return { totalIncome: income, totalExpense: expense, netProfit: profit };
  }, [reportData]); 


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

      {/* Блок ИТОГО */}
      {reportData && ( // Показываем ИТОГО, если reportData не null
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <dl>
              <dt className="text-sm font-medium text-gray-500">Доходы</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
                {totalIncome.toFixed(2)} {activeWorkspace?.currency || ''}
              </dd>
            </dl>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <dl>
              <dt className="text-sm font-medium text-gray-500">Расходы</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
                {totalExpense.toFixed(2)} {activeWorkspace?.currency || ''}
              </dd>
            </dl>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <dl>
              <dt className="text-sm font-medium text-gray-500">Чистая прибыль</dt>
              <dd className={`mt-1 text-3xl font-semibold tracking-tight ${netProfit >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                {netProfit.toFixed(2)} {activeWorkspace?.currency || ''}
              </dd>
            </dl>
          </div>
        </div>
      )}

      {/* Рендерим DdsReportTable только если reportData не пустой и не в состоянии загрузки/ошибки */}
      {reportData && reportData.length > 0 && !loading && !error && <DdsReportTable data={reportData} />}

      {reportData && reportData.length === 0 && !loading && !error && (
        <div className="mt-6 text-center text-gray-500">
          <p>Нет данных для выбранного периода.</p>
        </div>
      )}
    </div>
  );
}

export default DdsReportPage;