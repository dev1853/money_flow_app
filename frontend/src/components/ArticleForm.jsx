import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Alert from './Alert';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';
import Button from './Button';

// Вспомогательная функция для построения дерева для <select>
const buildArticleOptions = (articles, parentId = null, level = 0) => {
  let options = [];
  const children = articles.filter(a => a.parent_id === parentId);
  for (const article of children) {
    options.push({ ...article, label: `${'— '.repeat(level)}${article.name}` });
    options = options.concat(buildArticleOptions(articles, article.id, level + 1));
  }
  return options;
};

function ArticleForm({ articleToEdit, parentId, onSuccess }) {
    const { activeWorkspace, user } = useAuth(); 
  
   const [formData, setFormData] = useState({ name: '', code: '', type: 'group', parent_id: parentId });
  const [allArticles, setAllArticles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(articleToEdit);

  useEffect(() => {
    if (activeWorkspace) {
      apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`)
        .then(data => setAllArticles(data || []))
        .catch(err => console.error("Failed to fetch articles list for form", err));
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: articleToEdit.name,
        code: articleToEdit.code || '',
        type: articleToEdit.type,
        parent_id: articleToEdit.parent_id,
      });
    } else {
      setFormData({ name: '', code: '', type: 'group', parent_id: parentId });
    }
  }, [articleToEdit, isEditMode, parentId]);
  
  const parentArticleOptions = useMemo(() => {
    let availableArticles = allArticles;
    if (isEditMode) {
      const articlesToExclude = new Set();
      const getChildrenIds = (articleId) => {
          articlesToExclude.add(articleId);
          allArticles.filter(a => a.parent_id === articleId).forEach(child => getChildrenIds(child.id));
      };
      getChildrenIds(articleToEdit.id);
      availableArticles = allArticles.filter(a => !articlesToExclude.has(a.id));
    }
    return buildArticleOptions(availableArticles);
  }, [allArticles, articleToEdit, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const dataToSend = { ...formData, parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null };
    try {
      if (isEditMode) {
        await apiService.put(`/dds-articles/${articleToEdit.id}`, {
            name: dataToSend.name,
            type: dataToSend.type,
            parent_id: dataToSend.parent_id
        });
      } else {
        await apiService.post('/dds-articles/', { 
            ...dataToSend, 
            workspace_id: activeWorkspace.id,
            owner_id: user.id 
        });
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}
      <div>
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="type">Тип</Label>
        <Select id="type" name="type" value={formData.type} onChange={handleChange} required>
          <option value="group">Группа</option>
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="parent_id">Родительская статья</Label>
        <Select id="parent_id" name="parent_id" value={formData.parent_id || ""} onChange={handleChange}>
          <option value="">-- Корневая статья --</option>
          {parentArticleOptions.map(article => (<option key={article.id} value={article.id}>{article.label}</option>))}
        </Select>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}
export default ArticleForm;