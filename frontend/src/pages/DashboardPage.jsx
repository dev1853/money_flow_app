// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpCircleIcon, ArrowDownCircleIcon, ScaleIcon, CurrencyDollarIcon, 
  ExclamationTriangleIcon, ChartBarIcon as DashboardIcon // Заменил иконку для заголовка Дашборда
} from '@heroicons/react/24/outline';

// 1. Импорты для Chart.js
import { Line } from 'react-chartjs-2';
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
} from 'chart.js';

// 2. Регистрация элементов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { format, parseISO } from 'date-fns'; // Убрал isValid, т.к. проверяем наличие данных

const DashboardPage = () => {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [trendData, setTrendData] = useState(null); 
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount, currency = 'RUB') => {
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Убрал копейки для KPI
  };
  const formatCurrencyForChart = (amount, currency = 'RUB') => {
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Просто число для оси Y
  };


  const fetchDashboardData = useCallback(async () => {
    // ... (логика fetchDashboardData остается такой же, как в вашем последнем рабочем варианте)
    if (isAuthLoading) return;
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    setIsLoadingData(true); setError(null); setKpis(null); setTrendData(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const kpisPromise = fetch('http://localhost:8000/dashboard/kpis', { headers });
      const trendPromise = fetch('http://localhost:8000/dashboard/cashflow-trend', { headers });
      
      const [kpisResponse, trendResponse] = await Promise.all([kpisPromise, trendPromise]);

      let kpisError, trendError;

      if (!kpisResponse.ok) {
        const kpisErrorData = await kpisResponse.json().catch(() => ({}));
        kpisError = `KPI: ${kpisResponse.status} ${kpisErrorData.detail || 'Ошибка загрузки'}`;
      } else {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData);
      }

      if (!trendResponse.ok) {
        const trendErrorData = await trendResponse.json().catch(() => ({}));
        trendError = `Тренд: ${trendResponse.status} ${trendErrorData.detail || 'Ошибка загрузки'}`;
      } else {
        const trendResult = await trendResponse.json();
        setTrendData(trendResult);
      }

      if(kpisError || trendError) {
        throw new Error([kpisError, trendError].filter(Boolean).join('; '));
      }

    } catch (err) {
      setError(err.message);
      if (err.message.includes("401")) navigate('/login');
    } finally {
      setIsLoadingData(false);
    }
  }, [token, isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, isAuthLoading, isAuthenticated]);

  if (isAuthLoading) { /* ... индикатор загрузки аутентификации ... */ }
  if (!isAuthenticated && !isAuthLoading) { /* ... сообщение, что нужно войти ... */ }

  // 3. Подготовка данных для графика
  const lineChartData = {
    labels: trendData?.daily_flows?.map(flow => format(parseISO(flow.date), 'dd.MM')) || [],
    datasets: [
      {
        label: 'Доходы',
        data: trendData?.daily_flows?.map(flow => parseFloat(flow.total_income)) || [],
        borderColor: 'rgb(16, 185, 129)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
      },
      {
        label: 'Расходы',
        data: trendData?.daily_flows?.map(flow => parseFloat(flow.total_expenses)) || [],
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
      },
    ],
  };

  // 4. Опции графика
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 20, color: '#4b5563' } },
      tooltip: {
        mode: 'index', intersect: false, bodySpacing: 4, titleSpacing: 6,
        backgroundColor: 'rgba(0,0,0,0.7)', titleFont: {size: 14}, bodyFont: {size: 12},
        callbacks: { label: (context) => `${context.dataset.label || ''}: ${formatCurrency(context.parsed.y)}` }
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { 
        beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280', 
        callback: (value) => formatCurrencyForChart(value) } 
      },
    },
    elements: { line: { borderWidth: 2 }, point: { radius: 4, hoverRadius: 6 } }
  };

  const kpiStatCards = kpis ? [
    // Динамическое создание карточек для балансов по валютам
    ...(Object.entries(kpis.total_balances_by_currency).map(([currency, balance]) => ({
      id: `balance-${currency}`,
      name: `Общий баланс, ${currency}`,
      stat: formatCurrency(balance, currency),
      icon: ScaleIcon,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    }))),
    { id: 'income', name: 'Доход (30 дн)', stat: formatCurrency(kpis.total_income_last_30_days), icon: ArrowUpCircleIcon, iconColor: 'text-green-500', bgColor: 'bg-green-50' },
    { id: 'expense', name: 'Расход (30 дн)', stat: formatCurrency(kpis.total_expenses_last_30_days), icon: ArrowDownCircleIcon, iconColor: 'text-red-500', bgColor: 'bg-red-50' },
    { id: 'netflow', name: 'Чист. поток (30 дн)', stat: formatCurrency(kpis.net_cash_flow_last_30_days), icon: CurrencyDollarIcon, iconColor: parseFloat(kpis.net_cash_flow_last_30_days) >= 0 ? 'text-green-500' : 'text-red-500', bgColor: parseFloat(kpis.net_cash_flow_last_30_days) >= 0 ? 'bg-green-50' : 'bg-red-50'},
  ] : [];

  return (
    <div className="space-y-6 lg:space-y-8"> {/* Общий отступ для страницы */}
      <div className="flex items-center">
        <DashboardIcon className="h-8 w-8 text-indigo-600 mr-3" />
        <h2 className="text-3xl font-bold text-gray-800">Дашборд</h2>
      </div>

      {isLoadingData && ( <div>Loading data...</div> )}
      {error && ( <div className="text-red-500">Ошибка: {error}</div> )}

      {/* Сетка для KPI и графика */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* KPI Карточки */}
        {kpis && kpiStatCards.map((item) => (
          <div key={item.id} className="lg:col-span-3 md:col-span-6 col-span-12 rounded-lg bg-white p-5 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bgColor}`}>
                <item.icon className={`h-6 w-6 ${item.iconColor}`} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2">
              <p className={`text-3xl font-semibold text-gray-900 ${item.name.includes('Расход') || (item.name.includes('Чист. поток') && parseFloat(kpis.net_cash_flow_last_30_days) < 0) ? 'text-red-600' : item.name.includes('Доход') ? 'text-green-600' : ''}`}>
                {item.stat}
              </p>
            </div>
          </div>
        ))}

        {/* Карточка для Графика */}
        {!isLoadingData && !error && trendData && trendData.daily_flows && trendData.daily_flows.length > 0 && (
          <div className="lg:col-span-12 col-span-12 rounded-lg bg-white p-5 shadow-md hover:shadow-lg transition-shadow"> {/* График занимает всю ширину на lg */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Динамика денежных потоков <span className="text-sm text-gray-500">({trendData.period_start_date ? format(parseISO(trendData.period_start_date), 'dd.MM.yy') : ''} - {trendData.period_end_date ? format(parseISO(trendData.period_end_date), 'dd.MM.yy') : ''})</span>
            </h3>
            <div className="h-80 sm:h-96"> {/* Высота контейнера графика */}
              <Line options={lineChartOptions} data={lineChartData} />
            </div>
          </div>
        )}
      </div>
      
      {!isLoadingData && !error && !kpis && !trendData && ( 
        <div>Нет данных для отображения.</div>
      )}
    </div>
  );
};

export default DashboardPage;