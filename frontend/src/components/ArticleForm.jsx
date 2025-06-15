// frontend/src/components/ArticleForm.jsx

import React, { useState, useEffect, useMemo } from 'react'; // Удаляем useCallback
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Alert from './Alert';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';
import Textarea from './forms/Textarea';

const ArticleForm = ({ article, parentArticles = [], onSuccess, formId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'expense',
    parent_id: null,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeWorkspace } = useAuth();

  useEffect(() => {
    if (article) {
      setFormData({
        name: article.name || '',
        description: article.description || '',
        type: article.type || 'expense',
        parent_id: article.parent_id || null,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'expense',
        parent_id: null,
      });
    }
  }, [article]);
  
  const filteredParentArticles = useMemo(() => {
    if (!article || !article.id) {
      return parentArticles;
    }
    return parentArticles.filter(p => p.id !== article.id);
  }, [parentArticles, article]);

  const handleChange = (e) => { // Больше не нужно оборачивать в useCallback
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === 'null' ? null : value,
    }));
  };

  const handleSubmit = async (e) => { // Больше не нужно оборачивать в useCallback
    e.preventDefault();
    if (!activeWorkspace) {
        setError("Рабочее пространство не выбрано.");
        return;
    }
    setError('');
    setIsSubmitting(true);

    const dataToSend = {
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      workspace_id: activeWorkspace.id,
    };
    
    try {
      if (article && article.id) {
        await apiService.put(`/dds_articles/${article.id}`, dataToSend);
      } else {
        await apiService.post(`/dds_articles`, dataToSend);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`${formId}-articleName`}>Название</Label>
        <Input type="text" name="name" id={`${formId}-articleName`} value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor={`${formId}-articleDescription`}>Описание</Label>
        <Textarea name="description" id={`${formId}-articleDescription`} value={formData.description} onChange={handleChange} rows={3} />
      </div>
      <div>
        <Label htmlFor={`${formId}-articleType`}>Тип</Label>
        <Select id={`${formId}-articleType`} name="type" value={formData.type} onChange={handleChange}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${formId}-parentArticle`}>Родительская статья</Label>
        <Select id={`${formId}-parentArticle`} name="parent_id" value={formData.parent_id || 'null'} onChange={handleChange}>
          <option value="null">-- Корневая статья --</option>
          {filteredParentArticles.map(p => (
            <option key={p.id} value={p.id}>
              {'\u00A0'.repeat(p.level * 4)} {p.name}
            </option>
          ))}
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
    </form>
  );
};

export default ArticleForm;