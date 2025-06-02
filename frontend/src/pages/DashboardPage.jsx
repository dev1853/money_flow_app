// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; //
import { useNavigate } from 'react-router-dom'; //
import {
  ArrowUpCircleIcon, //
  ArrowDownCircleIcon, //
  ScaleIcon, //
  CurrencyDollarIcon, //
  ChartBarIcon // Используется для PageTitle
} from '@heroicons/react/24/outline'; //

// Наши новые компоненты
import PageTitle from '../components/PageTitle';
import KpiCard from '../components/KpiCard';
import Loader from '../components/Loader';
import Alert from '../components/Alert';

import { Line } from 'react-chartjs-2'; //
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'; //

ChartJS.register( //
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { format, parseISO } from 'date-fns'; //

const DashboardPage = () => {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth(); //
  const navigate = useNavigate(); //

  const [kpis, setKpis] = useState(null); //
  const [trendData, setTrendData] = useState(null); //
  const [isLoadingData, setIsLoadingData] = useState(true); // Общий лоадер для данных дашборда
  const [error, setError] = useState(null); //

  const formatCurrency = (amount, currency = 'RUB') => { //
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  const formatCurrencyForChart = (amount, currency = 'RUB') => { //
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const fetchDashboardData = useCallback(async () => { //
    if (isAuthLoading) return;
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    setIsLoadingData(true); setError(null); setKpis(null); setTrendData(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` }; //
      const kpisPromise = fetch('http://localhost:8000/dashboard/kpis', { headers }); //
      const trendPromise = fetch('http://localhost:8000/dashboard/cashflow-trend', { headers }); //

      const [kpisResponse, trendResponse] = await Promise.all([kpisPromise, trendPromise]); //

      let kpisErrorMsg, trendErrorMsg;

      if (!kpisResponse.ok) { //
        const kpisErrorData = await kpisResponse.json().catch(() => ({}));
        kpisErrorMsg = `KPIs: ${kpisResponse.status} ${kpisErrorData.detail || 'Ошибка загрузки'}`;
      } else {
        const kpisData = await kpisResponse.json(); //
        setKpis(kpisData); //
      }

      if (!trendResponse.ok) { //
        const trendErrorData = await trendResponse.json().catch(() => ({}));
        trendErrorMsg = `Тренд: ${trendResponse.status} ${trendErrorData.detail || 'Ошибка загрузки'}`;
      } else {
        const trendResult = await trendResponse.json(); //
        setTrendData(trendResult); //
      }

      const combinedError = [kpisErrorMsg, trendErrorMsg].filter(Boolean).join('; ');
      if (combinedError) {
        throw new Error(combinedError);
      }

    } catch (err) { //
      setError(err.message); //
      if (err.message.includes("401")) navigate('/login'); //
    } finally {
      setIsLoadingData(false); //
    }
  }, [token, isAuthenticated, isAuthLoading, navigate]); //

  useEffect(() => { //
    if (!isAuthLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, isAuthLoading, isAuthenticated]); //


  const lineChartData = { //
    labels: trendData?.daily_flows?.map(flow => format(parseISO(flow.date), 'dd.MM')) || [], //
    datasets: [
      {
        label: 'Доходы', //
        data: trendData?.daily_flows?.map(flow => parseFloat(flow.total_income)) || [], //
        borderColor: 'rgb(16, 185, 129)', //
        backgroundColor: 'rgba(16, 185, 129, 0.1)', //
        fill: true, //
        tension: 0.3, //
        pointBackgroundColor: 'rgb(16, 185, 129)', //
        pointBorderColor: '#fff', //
        pointHoverBackgroundColor: '#fff', //
        pointHoverBorderColor: 'rgb(16, 185, 129)', //
      },
      {
        label: 'Расходы', //
        data: trendData?.daily_flows?.map(flow => parseFloat(flow.total_expenses)) || [], //
        borderColor: 'rgb(239, 68, 68)', //
        backgroundColor: 'rgba(239, 68, 68, 0.1)', //
        fill: true, //
        tension: 0.3, //
        pointBackgroundColor: 'rgb(239, 68, 68)', //
        pointBorderColor: '#fff', //
        pointHoverBackgroundColor: '#fff', //
        pointHoverBorderColor: 'rgb(239, 68, 68)', //
      },
    ],
  };

  const lineChartOptions = { //
    responsive: true, //
    maintainAspectRatio: false, //
    plugins: { //
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 20, color: '#4b5563' } }, //
      tooltip: { //
        mode: 'index', intersect: false, bodySpacing: 4, titleSpacing: 6,
        backgroundColor: 'rgba(0,0,0,0.7)', titleFont: {size: 14}, bodyFont: {size: 12},
        callbacks: { label: (context) => `${context.dataset.label || ''}: ${formatCurrency(context.parsed.y)}` } //
      },
    },
    scales: { //
      x: { grid: { display: false }, ticks: { color: '#6b7280' } }, //
      y: { //
        beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280',
        callback: (value) => formatCurrencyForChart(value) }
      },
    },
    elements: { line: { borderWidth: 2 }, point: { radius: 4, hoverRadius: 6 } } //
  };


  // Лоадер на время проверки аутентификации (первичная загрузка страницы)
  if (isAuthLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader message="Загрузка страницы..." />
      </div>
    );
  }
  // Сообщение, если не аутентифицирован (хотя ProtectedRoute должен редиректить)
  if (!isAuthenticated && !isAuthLoading) {
    return (
        <div className="p-4 text-center">
            <Alert type="error" title="Доступ запрещен" message="Пожалуйста, войдите в систему для просмотра дашборда."/>
        </div>
    );
  }


  return (
    <div className="space-y-6 lg:space-y-8">
      <PageTitle
        title="Дашборд"
        icon={<ChartBarIcon className="h-8 w-8 text-indigo-600" />} // Передаем элемент иконки
      />

      {/* Отображение общей ошибки загрузки данных */}
      {error && !isLoadingData && (
        <Alert type="error" title="Ошибка загрузки данных" message={error} />
      )}

      {/* Отображение общего лоадера, пока грузятся KPI и тренды */}
      {isLoadingData && (
        <div className="col-span-full text-center py-10">
          <Loader message="Загрузка данных дашборда..." />
        </div>
      )}

      {/* Сетка для KPI и графика */}
      {!isLoadingData && kpis && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* KPI Карточки */}
          {Object.entries(kpis.total_balances_by_currency).map(([currency, balance]) => ( //
            <KpiCard
              key={`balance-${currency}`}
              title={`Общий баланс, ${currency}`}
              value={formatCurrency(balance, currency)} //
              icon={ScaleIcon} //
              iconColor="text-indigo-500" //
              iconBgColor="bg-indigo-50" //
            />
          ))}
          <KpiCard
            title="Доход (30 дн)"
            value={formatCurrency(kpis.total_income_last_30_days)} //
            icon={ArrowUpCircleIcon} //
            iconColor="text-green-500" //
            iconBgColor="bg-green-50" //
            valueColor="text-green-600"
          />
          <KpiCard
            title="Расход (30 дн)"
            value={formatCurrency(kpis.total_expenses_last_30_days)} //
            icon={ArrowDownCircleIcon} //
            iconColor="text-red-500" //
            iconBgColor="bg-red-50" //
            valueColor="text-red-600"
          />
          <KpiCard
            title="Чист. поток (30 дн)"
            value={formatCurrency(kpis.net_cash_flow_last_30_days)} //
            icon={CurrencyDollarIcon} //
            iconColor={parseFloat(kpis.net_cash_flow_last_30_days) >= 0 ? 'text-green-500' : 'text-red-500'} //
            iconBgColor={parseFloat(kpis.net_cash_flow_last_30_days) >= 0 ? 'bg-green-50' : 'bg-red-50'} //
            valueColor={parseFloat(kpis.net_cash_flow_last_30_days) >= 0 ? 'text-green-600' : 'text-red-600'}
          />

          {/* Карточка для Графика */}
          {trendData && trendData.daily_flows && trendData.daily_flows.length > 0 && ( //
            <div className="lg:col-span-12 col-span-12 rounded-lg bg-white p-5 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Динамика денежных потоков <span className="text-sm text-gray-500">({trendData.period_start_date ? format(parseISO(trendData.period_start_date), 'dd.MM.yy') : ''} - {trendData.period_end_date ? format(parseISO(trendData.period_end_date), 'dd.MM.yy') : ''})</span> {/* */}
              </h3>
              <div className="h-80 sm:h-96"> {/* */}
                <Line options={lineChartOptions} data={lineChartData} /> {/* */}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Сообщение, если нет данных KPI после загрузки (например, ошибка была только для трендов) */}
      {!isLoadingData && !kpis && !error && (
        <EmptyState
            title="Нет данных для отображения"
            message="Не удалось загрузить ключевые показатели."
            icon={<ChartBarIcon />}
        />
      )}
    </div>
  );
};

export default DashboardPage; //