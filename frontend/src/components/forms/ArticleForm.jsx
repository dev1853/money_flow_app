// frontend/src/components/forms/ArticleForm.jsx
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
}) {
  const { activeWorkspace } = useAuth();
  const [name, setName] = useState('');
  const [articleType, setArticleType] = useState('EXPENSE');
  const [currentParentId, setCurrentParentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parentArticleOptions = useMemo(
    () => buildArticleOptions(articlesTree, '', articleToEdit?.id),
    [articlesTree, articleToEdit]
  );

  useEffect(() => {
    if (isVisible) {
      setError('');
      if (articleToEdit) {
        setName(articleToEdit.name);
        setArticleType(articleToEdit.article_type);
        setCurrentParentId(articleToEdit.parent_id);
      } else {
        setName('');
        setArticleType('EXPENSE');
        setCurrentParentId(parentId);
      }
    }
  }, [articleToEdit, parentId, isVisible]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Название статьи не может быть пустым.');
      return;
    }
    setLoading(true);
    setError('');

    const workspaceId = activeWorkspace?.id;
    if (!workspaceId) {
      setError("Критическая ошибка: не удалось определить рабочее пространство.");
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
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}
      <div>
        <Label htmlFor="article_name">Название</Label>
        <Input
          id="article_name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="article_type">Тип</Label>
        <Select
          id="article_type"
          name="type"
          value={articleType}
          onChange={(e) => setArticleType(e.target.value)}
          required
        >
          {/* Мы не стилизуем <option> напрямую, так как их вид контролируется ОС,
              но родительский <Select> уже адаптирован. */}
          <option value="group">Группа</option>
          <option value="INCOME">Доход</option>
          <option value="EXPENSE">Расход</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="parent_id">Родительская статья</Label>
        <Select
          id="parent_id"
          name="parent_id"
          value={currentParentId || ""}
          onChange={(e) => setCurrentParentId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Корневая статья --</option>
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