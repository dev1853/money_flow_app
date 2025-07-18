import React, { useMemo } from 'react';
import * as Recharts from 'recharts';

const COLORS = [
  '#6366f1', '#06b6d4', '#f59e42', '#ef4444', '#a78bfa', '#f43f5e',
  '#22d3ee', '#fbbf24', '#f87171', '#c4b5fd', '#fb7185'
];

const ExpensesByCounterpartiesWidget = ({ data }) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .filter(item => item && typeof item.total_amount === 'number' && item.total_amount < 0)
      .map(item => ({
        name: item.counterparty_name || 'Без названия',
        value: Math.abs(item.total_amount),
      }));
  }, [data]);

  // Сумма всех расходов для процента
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 flex flex-col items-center max-w-full">
      <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Расходы по контрагентам</h5>
      <div className="w-full flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="flex-shrink-0 flex justify-center items-center w-full md:w-[260px]">
          <Recharts.PieChart width={220} height={220}>
            <Recharts.Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={false}
            >
              {chartData.map((entry, index) => (
                <Recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Recharts.Pie>
            <Recharts.Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                color: '#1e293b',
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value, name) => [
                `${value.toLocaleString('ru-RU')} ₽`,
                name,
              ]}
            />
          </Recharts.PieChart>
        </div>
        {/* Кастомная легенда */}
        <div className="w-full flex-1 mt-4 md:mt-0 overflow-auto max-h-[220px]">
          {chartData.map((entry, idx) => (
            <div key={entry.name} className="flex items-center mb-2">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-gray-700 dark:text-gray-200 text-sm flex-1 truncate">{entry.name}</span>
              <span className="text-gray-900 dark:text-white font-semibold ml-2">
                {entry.value.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpensesByCounterpartiesWidget;