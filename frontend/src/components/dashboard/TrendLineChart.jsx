import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FLOWBITE_COLORS = {
  income: '#6366f1',   // Indigo
  expense: '#ef4444',  // Red
  net: '#06b6d4',      // Cyan
};

function TrendLineChart({ data, theme }) {
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Тренд денежных потоков</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis
            dataKey="event_date_formatted"
            tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563', fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563', fontSize: 13 }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={v => v.toLocaleString('ru-RU')}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
              color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: 14,
            }}
            formatter={(value) => `${value.toLocaleString('ru-RU')} ₽`}
          />
          <Legend
            wrapperStyle={{
              color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
              fontSize: 14,
            }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke={FLOWBITE_COLORS.income}
            name="Доход"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke={FLOWBITE_COLORS.expense}
            name="Расход"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="net_balance"
            stroke={FLOWBITE_COLORS.net}
            name="Чистый поток"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendLineChart; 