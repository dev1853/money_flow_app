// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Loader from '../components/Loader';
import KpiCard from '../components/KpiCard';

const DashboardPage = () => {
  const [kpis, setKpis] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeWorkspace } = useAuth();

  const fetchData = useCallback(async () => {
    if (!activeWorkspace) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    try {
        const params = new URLSearchParams({ workspace_id: activeWorkspace.id });
        const [kpisData, cashflowData] = await Promise.all([
            apiService.get(`/dashboard/kpis?${params.toString()}`),
            apiService.get(`/dashboard/cashflow-trend?${params.toString()}`)
        ]);
        setKpis(kpisData);
        setTrendData(cashflowData);
    } catch (error) {
        console.error("DashboardPage: Ошибка загрузки данных:", error);
    } finally {
        setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
      fetchData();
  }, [fetchData]);

  if (isLoading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Дашборд</h1>
      {!activeWorkspace ? (
        <p>Пожалуйста, выберите или создайте рабочее пространство.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {kpis && Object.entries(kpis).map(([key, value]) => (
                <KpiCard key={key} title={key} value={value} />
            ))}
          </div>
          {/* Здесь можно будет добавить график на основе trendData */}
        </>
      )}
    </div>
  );
};

export default DashboardPage;