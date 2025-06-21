import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import KpiCard from '../components/KpiCard';
import Loader from '../components/Loader';
import Alert from '../components/Alert';

function DashboardPage() {
  const { activeWorkspace } = useAuth();
  
  const [kpiData, setKpiData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Не делаем запросы, пока не будет выбрано рабочее пространство
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // --- ИЗМЕНЕНИЕ: Добавляем workspace_id в параметры запроса ---
        const params = new URLSearchParams({ workspace_id: activeWorkspace.id });
        
        const [kpis, trend] = await Promise.all([
          apiService.get(`/dashboard/kpis?${params.toString()}`),
          apiService.get(`/dashboard/cashflow-trend?${params.toString()}`)
        ]);

        setKpiData(kpis);
        setTrendData(trend);

      } catch (err) {
        console.error("DashboardPage: Ошибка загрузки данных:", err);
        setError(err.message || 'Не удалось загрузить данные для дашборда');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeWorkspace]); // Эффект перезапускается при смене воркспейса

  if (loading) {
    return <Loader text="Загрузка дашборда..." />;
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }
  
  if (!activeWorkspace) {
    return <Alert type="info">Пожалуйста, выберите или создайте рабочее пространство.</Alert>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Дашборд: {activeWorkspace.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {kpiData ? (
          <>
            <KpiCard title="Текущий баланс" value={kpiData.current_balance} currency="RUB" />
            <KpiCard title="Доходы за месяц" value={kpiData.total_income} currency="RUB" />
            <KpiCard title="Расходы за месяц" value={kpiData.total_expense} currency="RUB" />
            <KpiCard title="Чистый поток" value={kpiData.net_flow} currency="RUB" />
          </>
        ) : (
          <p>Нет данных для отображения KPI.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Тренд денежного потока</h2>
        {trendData ? (
          <div className="h-64 bg-gray-100 flex items-center justify-center rounded-md">
             <p className="text-gray-500">Компонент графика еще не реализован</p>
          </div>
        ) : (
          <p>Нет данных для построения графика.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;