// frontend/src/pages/MappingRulesPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import Textarea from '../components/forms/Textarea';
import ConfirmationModal from '../components/ConfirmationModal'; 
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'; 
import MappingRulesTable from '../components/MappingRulesTable';
import Pagination from '../components/Pagination'; 


const ITEMS_PER_PAGE = 10; // Определяем количество элементов на страницу


function MappingRulesPage() {
  const { activeWorkspace } = useAuth();
  const [rules, setRules] = useState([]);
  const [totalRulesCount, setTotalRulesCount] = useState(0); // <--- НОВОЕ СОСТОЯНИЕ ДЛЯ ОБЩЕГО КОЛИЧЕСТВА
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null); 
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1); // <--- НОВОЕ СОСТОНИЕ ДЛЯ ТЕКУЩЕЙ СТРАНИЦЫ


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


  // ИЗМЕНЕНО: fetchRules теперь принимает page
  const fetchRules = useCallback(async (page) => { 
    setLoading(true);
    setError('');
    try {
      if (!activeWorkspace) {
        setError("Рабочее пространство не активно.");
        setLoading(false);
        return;
      }
      const skip = (page - 1) * ITEMS_PER_PAGE; // Вычисляем skip
      const limit = ITEMS_PER_PAGE;             // Вычисляем limit

      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        skip: skip,   // <--- ДОБАВЛЕНО
        limit: limit, // <--- ДОБАВЛЕНО
      });

      const data = await apiService.get(`/mapping_rules/?${params.toString()}`);
      setRules(data.items);        // <--- ИЗМЕНЕНО: получаем items
      setTotalRulesCount(data.total_count); // <--- НОВОЕ: сохраняем общее количество
    } catch (err) {
      setError(err.message || "Не удалось загрузить правила сопоставления.");
      console.error("Ошибка загрузки правил:", err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]); // activeWorkspace в зависимостях

   useEffect(() => {
    if (activeWorkspace) {
      fetchRules(currentPage); // Вызываем fetchRules с currentPage
    }
  }, [activeWorkspace, currentPage, fetchRules]);
  
  const fetchDdsArticles = async () => {
    try {
      if (!activeWorkspace) return;
      const fetchedDdsArticles = await apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`);
      setDdsArticles(fetchedDdsArticles);
    } catch (err) {
      console.error("Не удалось загрузить статьи ДДС:", err.message || err);
      setError(err.message || "Не удалось загрузить статьи ДДС."); 
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchRules(currentPage); // <--- Передаем currentPage при первой загрузке
    }
    fetchDdsArticles();
  }, [activeWorkspace, fetchRules]); // Зависимости для useEffect, добавлен fetchRules


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

  const handleCloseFormModal = useCallback(() => {
    setShowFormModal(false);
    setEditingRule(null);
    setFormError('');
    setSuccessMessage(''); 
    fetchRules(currentPage); // <--- Обновляем список после сохранения/закрытия
  }, [fetchRules, currentPage]);


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
        // fetchRules(currentPage); // Это вызывается в handleCloseFormModal
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

  const handleConfirmDelete = useCallback(async () => {
    setFormLoading(true);
    setFormError('');
    setSuccessMessage('');
    try {
      if (!ruleToDelete) return;
      await apiService.delete(`/mapping_rules/${ruleToDelete.id}`);
      setSuccessMessage("Правило успешно удалено!");
      // fetchRules(currentPage); // Это вызывается в handleCloseFormModal после успешного удаления
      setTimeout(() => {
        setShowDeleteConfirmModal(false);
        setRuleToDelete(null);
        setSuccessMessage(''); 
        fetchRules(currentPage); // Обновляем список правил после удаления
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Не удалось удалить правило.");
    } finally {
      setFormLoading(false);
    }
  }, [ruleToDelete, fetchRules, currentPage]);


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6"> 
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <PageTitle title="Правила разнесения платежей" />
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button onClick={handleOpenCreateModal}><PlusIcon className="h-5 w-5 mr-2" /> Добавить правило</Button>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {successMessage && !showFormModal && <Alert type="success" className="my-4">{successMessage}</Alert>}
      {loading && <Loader text="Загрузка правил..." />}

      {!loading && !error && (
        <MappingRulesTable 
          rules={rules} 
          onEdit={handleOpenEditModal} 
          onDelete={handleDeleteClick} 
        />
      )}

      {/* Компонент пагинации */}
      {!loading && !error && totalRulesCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRulesCount / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal 
        isOpen={showFormModal} 
        onClose={handleCloseFormModal} 
        title={editingRule ? "Редактировать правило" : "Добавить новое правило"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}
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
              className="block w-full" 
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
              className="block w-full" 
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
              className="block w-full" 
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
              className="block w-full" 
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

      <ConfirmationModal
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
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