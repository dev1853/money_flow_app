// frontend/src/components/ArticleForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Alert from './Alert';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';
import Button from './Button';

const buildArticleOptions = (articles, parentId = null, level = 0) => {
    // ... эта функция остается без изменений
};

function ArticleForm({ articleToEdit, parentId, onSuccess }) {
  const { activeWorkspace } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', code: '', type: 'income', parent_id: parentId });
  const [allArticles, setAllArticles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(articleToEdit);

  useEffect(() => {
    if (activeWorkspace) {
      apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`)
        .then(data => setAllArticles(data || []))
        .catch(err => console.error("Failed to fetch articles list", err));
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
      setFormData({ name: '', code: '', type: 'income', parent_id: parentId });
    }
  }, [articleToEdit, isEditMode, parentId]);
  
  const parentArticleOptions = useMemo(() => {
      // ... эта логика остается без изменений
  }, [allArticles, articleToEdit, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const finalParentId = formData.parent_id ? parseInt(formData.parent_id, 10) : null;
    const dataToSend = { ...formData, parent_id: finalParentId };

    try {
      if (isEditMode) {
        // При редактировании отправляем только те поля, что есть в форме
        await apiService.put(`/dds-articles/${articleToEdit.id}`, {
            name: dataToSend.name,
            code: dataToSend.code,
            type: dataToSend.type,
            parent_id: dataToSend.parent_id
        });
      } else {
        // При создании добавляем обязательные системные поля
        await apiService.post('/dds-articles/', {
            ...dataToSend,
            owner_id: activeWorkspace.owner_id,
            workspace_id: activeWorkspace.id
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
        <Label htmlFor="article_name">Название</Label>
        <Input id="article_name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="article_code">Код</Label>
        <Input id="article_code" name="code" value={formData.code} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="article_type">Тип</Label>
        <Select id="article_type" name="type" value={formData.type} onChange={handleChange} required>
          <option value="group">Группа</option>
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="parent_id">Родительская статья</Label>
        <Select id="parent_id" name="parent_id" value={formData.parent_id || ""} onChange={handleChange}>
          <option value="">-- Корневая статья --</option>
          {parentArticleOptions?.map(article => (
            <option key={article.id} value={article.id}>{article.label}</option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}
export default ArticleForm;