// frontend/src/components/ArticleForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import Alert from '../Alert';
import Input from './Input';
import Label from './Label';
import Select from './Select';
import Button from '../Button';

const buildArticleOptions = (articles, prefix = '', disabledId = null) => {
  let options = [];
  if (!articles) return options;

  articles.forEach(article => {
    const isDisabled = article.id === disabledId;
    options.push(
      <option key={article.id} value={article.id} disabled={isDisabled}>
        {prefix}{article.name}
      </option>
    );
    if (article.children && article.children.length > 0) {
      options = options.concat(
        buildArticleOptions(article.children, prefix + '-- ', disabledId)
      );
    }
  });
  return options;
};

function ArticleForm({
  articleToEdit,
  parentId,
  onSuccess,
  articlesTree,
  isVisible,
  onCancel,
}) {
  const { activeWorkspace } = useAuth();
  const [name, setName] = useState('');
  const [articleType, setArticleType] = useState('EXPENSE');
  const [currentParentId, setCurrentParentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. ОПТИМИЗАЦИЯ: `useMemo` кеширует список опций, чтобы не пересчитывать его на каждый рендер.
  // Теперь он будет работать, так как `articlesTree` будет получен.
  const parentArticleOptions = useMemo(
    () => buildArticleOptions(articlesTree, '', articleToEdit?.id),
    [articlesTree, articleToEdit]
  );

  // 2. УЛУЧШЕНИЕ: `useEffect` для корректного управления состоянием формы.
  useEffect(() => {
    // Срабатывает только когда модальное окно видимо
    if (isVisible) {
      setError(''); // Сбрасываем ошибку при каждом открытии
      if (articleToEdit) {
        // РЕЖИМ РЕДАКТИРОВАНИЯ: Заполняем поля из полученного объекта
        setName(articleToEdit.name);
        setArticleType(articleToEdit.article_type);
        setCurrentParentId(articleToEdit.parent_id);
      } else {
        // РЕЖИМ СОЗДАНИЯ: Сбрасываем поля и устанавливаем родителя
        setName('');
        setArticleType('EXPENSE');
        setCurrentParentId(parentId);
      }
    }
  }, [articleToEdit, parentId, isVisible]); // Зависимости для корректного обновления

  // 3. УЛУЧШЕНИЕ: Логика отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Название статьи не может быть пустым.');
      return;
    }
    
    setLoading(true);
    setError('');

    // 3. --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
    // Берем ID напрямую из activeWorkspace. Это самый надежный способ.
    const workspaceId = activeWorkspace?.id;

    if (!workspaceId) {
      setError("Критическая ошибка: не удалось определить рабочее пространство. Обновите страницу.");
      setLoading(false);
      return;
    }

    const articleData = {
      name,
      article_type: articleType,
      parent_id: currentParentId,
      workspace_id: workspaceId,
    };

    try {
      if (articleToEdit) {
        await apiService.updateDdsArticle(articleToEdit.id, articleData);
      } else {
        await apiService.createDdsArticle(articleData);
      }
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Произошла неизвестная ошибка.';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  console.log("Текущий parent_id в состоянии:", currentParentId);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}
      <div>
        <Label htmlFor="article_name">Название</Label>
        {/* Используем 'name' и 'setName' */}
        <Input
          id="article_name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Поле "Код", которого не было в логике. */}
      {/* Если оно нужно, добавьте состояние: const [code, setCode] = useState(''); */}
      {/* <div>
        <Label htmlFor="article_code">Код</Label>
        <Input
          id="article_code"
          name="code"
          // value={code}
          // onChange={(e) => setCode(e.target.value)}
        />
      </div> */}

      <div>
        <Label htmlFor="article_type">Тип</Label>
        {/* Используем 'articleType' и 'setArticleType' */}
        <Select
          id="article_type"
          name="type"
          value={articleType}
          onChange={(e) => setArticleType(e.target.value)}
          required
        >
          <option value="group">Группа</option>
          <option value="INCOME">Доход</option>
          <option value="EXPENSE">Расход</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="parent_id">Родительская статья</Label>
        {/* Используем 'currentParentId' и 'setCurrentParentId' */}
        <Select
          id="parent_id"
          name="parent_id"
          value={currentParentId || ""}
          onChange={(e) => setCurrentParentId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Корневая статья --</option>
          {/* Просто вставляем готовый массив опций */}
          {parentArticleOptions}
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}
export default ArticleForm;