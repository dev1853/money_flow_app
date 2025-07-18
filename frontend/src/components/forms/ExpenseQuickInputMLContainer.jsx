import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import ExpenseQuickInputML from './ExpenseQuickInputML';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../Alert';

function flattenExpenseArticles(articles, level = 0) {
  let result = [];
  for (const a of articles) {
    if (a.article_type === 'expense') {
      result.push(a);
    }
    if (a.children && a.children.length) {
      result = result.concat(flattenExpenseArticles(a.children, level + 1));
    }
  }
  return result;
}

// Удаляем mlToDdsMap — теперь ищем только по реальным названиям из базы

export default function ExpenseQuickInputMLContainer({ onSave: onSaveProp, ...props }) {
  const { activeWorkspace, accounts } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [categoryNotFound, setCategoryNotFound] = useState(false);

  useEffect(() => {
    if (!activeWorkspace?.id) {
      setLoading(false);
      return;
    }
    apiService.getDdsArticles({ workspace_id: activeWorkspace.id })
      .then(data => {
        const flat = flattenExpenseArticles(data);
        setCategories(flat);
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  // Сброс сообщений при открытии формы или изменении input
  useEffect(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, [activeWorkspace]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSave = async ({ amount, description, category }) => {
    setSuccessMessage('');
    setErrorMessage('');
    setCategoryNotFound(false);
    try {
      // Ищем статью только по реальному названию из базы
      const ddsArticle = categories.find(c => c.name === category);
      if (!ddsArticle) {
        setErrorMessage('Категория не найдена!');
        setSuccessMessage('');
        setCategoryNotFound(true);
        return;
      }
      const fromAccountId = accounts && accounts.length > 0 ? accounts[0].id : null;
      if (!fromAccountId) {
        setErrorMessage('Счёт не найден!');
        setSuccessMessage('');
        setCategoryNotFound(false);
        return;
      }
      const payload = {
        amount,
        description,
        transaction_type: "EXPENSE",
        transaction_date: new Date().toISOString().slice(0, 10),
        from_account_id: fromAccountId,
        dds_article_id: ddsArticle.id,
      };
      await apiService.createTransaction(payload, { workspace_id: activeWorkspace.id });
      setErrorMessage(''); // сбрасываем ошибку
      setCategoryNotFound(false); // сбрасываем флаг
      setSuccessMessage('Расход успешно добавлен!');
      if (onSaveProp) onSaveProp();
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось добавить расход.');
      setSuccessMessage('');
      setCategoryNotFound(false);
    }
  };

  if (loading) return <div>Загрузка категорий...</div>;

  return (
    <>
      {successMessage && <Alert type="success" className="mb-2">{successMessage}</Alert>}
      {errorMessage && <Alert type="error" className="mb-2">{errorMessage}</Alert>}
      <ExpenseQuickInputML
        {...props}
        allCategories={categories.map(c => c.name)}
        onSave={handleSave}
        setSuccessMessage={setSuccessMessage}
        setErrorMessage={setErrorMessage}
        categoryNotFound={categoryNotFound}
        setCategoryNotFound={setCategoryNotFound}
      />
    </>
  );
} 