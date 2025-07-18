import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import Input from './Input';
import Button from '../Button';
import Select from './Select';

export default function ExpenseQuickInputML({ onSave, allCategories = [], setSuccessMessage, setErrorMessage, categoryNotFound, setCategoryNotFound }) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState({ amount: '', description: '' });
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [category, setCategory] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Простой парсер: ищет первое число как сумму, остальное — описание
  const parseInput = (str) => {
    const match = str.match(/^\s*(\d+[\.,]?\d*)\s*(.*)$/);
    if (match) {
      return { amount: match[1].replace(',', '.'), description: match[2].trim() };
    }
    return { amount: '', description: str.trim() };
  };

  const handleSuggest = async () => {
    setError('');
    setSuccess(false);
    const { amount, description } = parseInput(input);
    setParsed({ amount, description });
    console.log('[ExpenseQuickInputML] handleSuggest: parsed', { amount, description });
    if (!amount || !description) return;
    setLoading(true);
    try {
      console.log('[ExpenseQuickInputML] handleSuggest: calling categorizeExpenseML', { amount, description });
      const res = await apiService.categorizeExpenseML(Number(amount), description, allCategories);
      console.log('[ExpenseQuickInputML] handleSuggest: API response', res);
      setSuggestedCategory(res.suggested_category);
      setConfidence(res.confidence);
      setAlternatives(res.alternatives || []);
      setCategory(res.suggested_category);
    } catch (e) {
      setError(e.message || 'Ошибка при категоризации');
      console.error('[ExpenseQuickInputML] handleSuggest: error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[ExpenseQuickInputML] handleSubmit', { parsed, category });
    if (!parsed.amount || !parsed.description || !category) return;
    if (onSave) {
      await onSave({ amount: Number(parsed.amount), description: parsed.description, category });
    }
    setSuccess(true);
    setInput('');
    setParsed({ amount: '', description: '' });
    setSuggestedCategory('');
    setConfidence(null);
    setAlternatives([]);
    setCategory('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    console.log('[ExpenseQuickInputML] input changed:', e.target.value);
    if (setSuccessMessage) setSuccessMessage('');
    if (setErrorMessage) setErrorMessage('');
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    console.log('[ExpenseQuickInputML] category changed:', e.target.value);
    if (setSuccessMessage) setSuccessMessage('');
    if (setErrorMessage) setErrorMessage('');
    if (setCategoryNotFound) setCategoryNotFound(false);
  };

  const selectOptions = (() => {
    if (categoryNotFound && alternatives.length > 0) {
      // Уникализируем: сначала альтернативы, потом все реальные категории без дубликатов
      const altSet = new Set(alternatives);
      return [
        ...alternatives.map(a => ({ value: a, label: a })),
        ...allCategories.filter(c => !altSet.has(c)).map(c => ({ value: c, label: c }))
      ];
    }
    // Обычный режим
    return confidence === 0 && suggestedCategory
      ? allCategories.map(c => ({ value: c, label: c }))
      : [
          { value: suggestedCategory, label: suggestedCategory },
          ...alternatives.filter(a => a !== suggestedCategory).map(a => ({ value: a, label: a }))
        ];
  })();

  console.log('[ExpenseQuickInputML] selectOptions:', selectOptions);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        name="expense-quick-input"
        type="text"
        placeholder="Пример: 500 такси"
        value={input}
        onChange={handleInputChange}
        // onBlur={handleSuggest} // убираем автозапуск
        required
      />
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={handleSuggest}
        disabled={loading || !input.trim()}
      >
        {loading ? 'Определяем...' : 'Определить статью'}
      </Button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {suggestedCategory && (
        <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
          <span className="text-sm text-gray-500 dark:text-gray-400">ИИ предлагает категорию:</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">{suggestedCategory}</span>
            <span className="text-xs text-gray-400">(уверенность: {(confidence * 100).toFixed(0)}%)</span>
          </div>
          <Select
            name="category-select"
            value={category}
            onChange={handleCategoryChange}
            options={selectOptions}
            className={`mt-2 ${categoryNotFound ? 'border-2 border-red-500' : ''}`}
          />
          {categoryNotFound && (
            <div className="text-xs text-red-500 mt-1">Выберите подходящую категорию вручную</div>
          )}
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={!category || loading}
      >
        {loading ? 'Сохраняем...' : 'Сохранить расход'}
      </Button>
      {/* {success && <div className="text-green-600 text-sm">Расход успешно сохранён!</div>} */}
    </form>
  );
} 