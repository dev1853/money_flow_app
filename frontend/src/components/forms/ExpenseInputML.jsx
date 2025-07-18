import React, { useState } from 'react';
import { apiService } from '../../services/apiService';

export default function ExpenseInputML({ onSave }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await apiService.categorizeExpenseML(Number(amount), description);
      setSuggestedCategory(res.suggested_category);
      setConfidence(res.confidence);
      setAlternatives(res.alternatives || []);
      setCategory(res.suggested_category);
    } catch (e) {
      setError(e.message || 'Ошибка при категоризации');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Здесь можно вызвать onSave или apiService.createTransaction
    if (onSave) {
      await onSave({ amount: Number(amount), description, category });
    }
    setSuccess(true);
    setAmount('');
    setDescription('');
    setSuggestedCategory('');
    setConfidence(null);
    setAlternatives([]);
    setCategory('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Сумма</label>
        <input
          type="number"
          className="input input-bordered w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
          placeholder="Введите сумму"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Комментарий</label>
        <input
          type="text"
          className="input input-bordered w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
          placeholder="Описание расхода"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>
      <button
        type="button"
        onClick={handleSuggest}
        disabled={loading || !amount || !description}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:from-blue-600 hover:to-indigo-700 transition"
      >
        {loading ? 'Анализируем...' : 'Предложить категорию (ИИ)'}
      </button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {suggestedCategory && (
        <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
          <span className="text-sm text-gray-500 dark:text-gray-400">ИИ предлагает категорию:</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">{suggestedCategory}</span>
            <span className="text-xs text-gray-400">(уверенность: {(confidence * 100).toFixed(0)}%)</span>
          </div>
          <select
            className="input input-bordered w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 mt-2"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value={suggestedCategory}>{suggestedCategory}</option>
            {alternatives.filter(a => a !== suggestedCategory).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={!category}
        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition"
      >
        Сохранить расход
      </button>
      {success && <div className="text-green-600 text-sm">Расход успешно сохранён!</div>}
    </form>
  );
} 