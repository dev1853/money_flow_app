// frontend/src/pages/MappingRulesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Импорт компонентов UI
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Modal from '../components/Modal'; 
import Select from '../components/forms/Select';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';
import Textarea from '../components/forms/Textarea'; // Добавим Textarea, если оно использовалось
import ConfirmationModal from '../components/ConfirmationModal'; 
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'; // Иконки для кнопок
import MappingRulesTable from '../components/MappingRulesTable'; // Импорт компонента таблицы


function MappingRulesPage() {
  const { activeWorkspace } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null); 
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
      keyword: '',
      dds_article_id: '',
      transaction_type: '', 
      priority: 0,
      is_active: true,
  });
  const [ddsArticles, setDdsArticles] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const buildArticleOptions = (articles, parentId = null, level = 0) => {
    let options = [];
    const children = articles.filter(a => a.parent_id === parentId);
    for (const article of children) {
      if (article.type !== 'group') {
        options.push({ value: article.id, label: `${'— '.repeat(level)}${article.name}` });
      }
      options = options.concat(buildArticleOptions(articles, article.id, article.type === 'group' ? level : level + 1));
    }
    return options;
  };

  const articleOptions = useMemo(() => {
    return buildArticleOptions(ddsArticles);
  }, [ddsArticles]);


  const fetchRules = async () => {
    setLoading(true);
    setError('');
    try {
      if (!activeWorkspace) {
        setError("Рабочее пространство не активно.");
        setLoading(false);
        return;
      }
      const fetchedRules = await apiService.get(`/mapping_rules/?workspace_id=${activeWorkspace.id}`);
      setRules(fetchedRules);
    } catch (err) {
      setError(err.message || "Не удалось загрузить правила сопоставления.");
      console.error("Ошибка загрузки правил:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDdsArticles = async () => {
    try {
      if (!activeWorkspace) return;
      const fetchedDdsArticles = await apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`);
      setDdsArticles(fetchedDdsArticles);
    } catch (err) {
      console.error("Не удалось загрузить статьи ДДС:", err.message || err);
      // Ошибка отображается на странице через Alert
      setError(err.message || "Не удалось загрузить статьи ДДС."); 
    }
  };

  useEffect(() => {
    fetchRules();
    fetchDdsArticles();
  }, [activeWorkspace]);


  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData({
        keyword: '',
        dds_article_id: '',
        transaction_type: '',
        priority: 0,
        is_active: true,
    });
    setFormError('');
    setSuccessMessage('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
        keyword: rule.keyword,
        dds_article_id: rule.dds_article_id,
        transaction_type: rule.transaction_type || '',
        priority: rule.priority,
        is_active: rule.is_active,
    });
    setFormError('');
    setSuccessMessage('');
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingRule(null);
    setFormError('');
    setSuccessMessage(''); 
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setSuccessMessage('');

    if (!activeWorkspace) {
        setFormError("Рабочее пространство не активно.");
        setFormLoading(false);
        return;
    }
    if (!formData.keyword || !formData.dds_article_id) {
        setFormError("Пожалуйста, заполните обязательные поля: Ключевое слово и Статья ДДС.");
        setFormLoading(false);
        return;
    }

    try {
        const dataToSubmit = {
            ...formData,
            priority: parseInt(formData.priority),
            dds_article_id: parseInt(formData.dds_article_id),
            transaction_type: formData.transaction_type || None,
            owner_id: activeWorkspace.owner_id,
            workspace_id: activeWorkspace.id,
        };

        let response;
        if (editingRule) {
            response = await apiService.put(`/mapping_rules/${editingRule.id}`, dataToSubmit);
            setSuccessMessage("Правило успешно обновлено!");
        } else {
            response = await apiService.post('/mapping_rules/', dataToSubmit);
            setSuccessMessage("Правило успешно создано!");
        }
        
        console.log("Rule saved/updated:", response);
        fetchRules();
        setTimeout(handleCloseFormModal, 1500);

    } catch (err) {
        setFormError(err.message || "Не удалось сохранить правило.");
        console.error("Ошибка сохранения правила:", err);
    } finally {
        setFormLoading(false);
    }
  };

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setFormLoading(true);
    setFormError('');
    setSuccessMessage('');
    try {
      await apiService.delete(`/mapping_rules/${ruleToDelete.id}`);
      setSuccessMessage("Правило успешно удалено!");
      fetchRules();
      setTimeout(() => {
        setShowDeleteConfirmModal(false);
        setRuleToDelete(null);
        setSuccessMessage(''); 
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Не удалось удалить правило.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    // Применяем стандартные отступы по бокам страницы
    <div className="px-4 sm:px-6 lg:px-8 py-6"> 
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <PageTitle title="Правила разнесения платежей" />
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button onClick={handleOpenCreateModal}><PlusIcon className="h-5 w-5 mr-2" /> Добавить правило</Button>
        </div>
      </div>

      {/* Сообщения об ошибках или успехе на уровне страницы */}
      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {successMessage && !showFormModal && <Alert type="success" className="my-4">{successMessage}</Alert>} {/* Показываем успех только после закрытия модалки */}
      {loading && <Loader text="Загрузка правил..." />}

      {/* Таблица правил - теперь это отдельный компонент */}
      {!loading && !error && (
        <MappingRulesTable 
          rules={rules} 
          onEdit={handleOpenEditModal} 
          onDelete={handleDeleteClick} 
        />
      )}

      {/* Модальное окно для создания/редактирования правила */}
      <Modal 
        isOpen={showFormModal} 
        onClose={handleCloseFormModal} 
        title={editingRule ? "Редактировать правило" : "Добавить новое правило"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}
          {/* successMessage для формы, если он должен быть внутри формы до её закрытия */}
          {successMessage && showFormModal && <Alert type="success">{successMessage}</Alert>}

          <div>
            <Label htmlFor="keyword">Ключевое слово</Label>
            <Input 
              type="text" 
              id="keyword" 
              name="keyword" 
              value={formData.keyword} 
              onChange={handleChange} 
              placeholder="Например, 'Яндекс.Такси'" 
              required 
              className="block w-full" // Убедимся, что инпут занимает всю ширину
            />
          </div>

          <div>
            <Label htmlFor="dds_article_id">Статья ДДС</Label>
            <Select 
              id="dds_article_id" 
              name="dds_article_id" 
              value={formData.dds_article_id || ''} 
              onChange={handleChange} 
              required
              className="block w-full" // Убедимся, что селект занимает всю ширину
            >
              <option value="">Выберите статью ДДС</option>
              {articleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="transaction_type">Тип транзакции</Label>
            <Select 
              id="transaction_type" 
              name="transaction_type" 
              value={formData.transaction_type} 
              onChange={handleChange}
              className="block w-full" // Убедимся, что селект занимает всю ширину
            >
              <option value="">Оба (Доход/Расход)</option>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Приоритет</Label>
            <Input 
              type="number" 
              id="priority" 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange} 
              min="0" 
              className="block w-full" // Убедимся, что инпут занимает всю ширину
            />
          </div>

          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="is_active" 
              name="is_active" 
              checked={formData.is_active} 
              onChange={handleChange} 
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <Label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Активно</Label>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" onClick={handleCloseFormModal} variant="secondary" className="mr-2">Отмена</Button>
            <Button type="submit" disabled={formLoading}>{formLoading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Удалить правило?"
        message={`Вы уверены, что хотите удалить правило '${ruleToDelete?.keyword}'? Это действие необратимо.`}
        confirmButtonText="Удалить"
        confirmButtonVariant="danger"
        loading={formLoading}
      />
    </div>
  );
}

export default MappingRulesPage;