import React, { useMemo } from 'react';
import * as Recharts from 'recharts';
import KpiCard from '../KpiCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

// Виджет теперь принимает isLoading и error от родителя
const ExpensesByCounterpartiesWidget = ({ data, isLoading, error }) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .filter(item => item && typeof item.total_amount === 'number' && item.total_amount < 0)
      .map(item => ({
        name: item.counterparty_name || 'Без названия',
        value: Math.abs(item.total_amount),
      }));
  }, [data]);

  return (
    // Передаем новые свойства в KpiCard
    <KpiCard
      title="Расходы по контрагентам"
      isLoading={isLoading}
      error={error}
    >
      {/* KpiCard сам решит, когда показывать этот блок */}
      {chartData.length > 0 ? (
        <Recharts.ResponsiveContainer width="100%" height={300}>
          <Recharts.PieChart>
            <Recharts.Tooltip formatter={(value) => `${value.toLocaleString('ru-RU')} ₽`} />
            <Recharts.Legend />
            <Recharts.Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                if (percent === 0) return '';
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                return (
                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {chartData.map((entry, index) => (
                <Recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Recharts.Pie>
          </Recharts.PieChart>
        </Recharts.ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Нет данных о расходах</p>
        </div>
      )}
    </KpiCard>
  );
};

export default ExpensesByCounterpartiesWidget;