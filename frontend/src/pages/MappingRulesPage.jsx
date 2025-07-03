// frontend/src/pages/MappingRulesPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useDataFetching } from '../hooks/useDataFetching'; // Наш кастомный хук

// Импорт компонентов UI
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Modal from '../components/Modal'; 
import Select from '../components/forms/Select';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';
import ConfirmationModal from '../components/ConfirmationModal'; 
import { PlusIcon } from '@heroicons/react/24/outline'; 
import MappingRulesTable from '../components/MappingRulesTable';
import Pagination from '../components/Pagination'; 

const ITEMS_PER_PAGE = 10;

// Вспомогательная функция для построения иерархического списка
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


function MappingRulesPage() {
  const { activeWorkspace } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Состояния для UI (модальные окна, формы) остаются в компоненте
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null); 
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
      keyword: '',
      dds_article_id: '',
      transaction_type: '', 
      priority: 0,
      is_active: true,
  });

  // --- НАЧАЛО РЕФАКТОРИНГА ---

  // 1. Загружаем статьи ДДС для выпадающего списка в форме
  const { data: ddsArticlesData } = useDataFetching(
    useCallback(() => {
        if (!activeWorkspace) return Promise.resolve([]); // Возвращаем пустой массив, если нет воркспейса
        return apiService.getDdsArticles(activeWorkspace.id);
    }, [activeWorkspace]),
    [activeWorkspace],
    { skip: !activeWorkspace }
  );
  const ddsArticles = ddsArticlesData || [];

  // 2. Определяем функцию для основного запроса (получение правил)
  const fetchRules = useCallback(async () => {
    const params = {
      workspace_id: activeWorkspace.id,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      limit: ITEMS_PER_PAGE,
    };
    return await apiService.getMappingRules(params);
  }, [activeWorkspace, currentPage]);

  // 3. Используем основной хук для загрузки правил
  const { 
    data: rulesData, // Содержит { items: [], total_count: 0 }
    loading, 
    error, 
    refetch 
  } = useDataFetching(fetchRules, [activeWorkspace, currentPage], { skip: !activeWorkspace });

  // --- КОНЕЦ РЕФАКТОРИНГА ---

  // Используем useMemo для кеширования отформатированного списка статей
  const articleOptions = useMemo(() => {
    return buildArticleOptions(ddsArticles);
  }, [ddsArticles]);


  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ (CRUD) ---

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData({
        keyword: '', dds_article_id: '', transaction_type: '',
        priority: 0, is_active: true,
    });
    setFormError('');
    setSuccessMessage('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
        keyword: rule.keyword, dds_article_id: rule.dds_article_id,
        transaction_type: rule.transaction_type || '', priority: rule.priority,
        is_active: rule.is_active,
    });
    setFormError('');
    setSuccessMessage('');
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingRule(null);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setSuccessMessage('');
    // ... прочая логика ...
    try {
        const dataToSubmit = { /* ... */ };
        if (editingRule) {
            await apiService.updateMappingRule(editingRule.id, dataToSubmit);
        } else {
            await apiService.createMappingRule(dataToSubmit);
        }
        setSuccessMessage("Правило успешно сохранено!");
        refetch(); // <-- Обновляем список после сохранения!
        setTimeout(handleCloseFormModal, 1500);
    } catch (err) {
        setFormError(err.message || "Не удалось сохранить правило.");
    } finally {
        setFormLoading(false);
    }
  };
  
  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!ruleToDelete) return;
    setFormLoading(true);
    try {
      await apiService.deleteMappingRule(ruleToDelete.id);
      setSuccessMessage("Правило успешно удалено!");
      setRuleToDelete(null);
      refetch(); // <-- Обновляем список после удаления!
    } catch (err) {
      setFormError(err.message || "Не удалось удалить правило.");
    } finally {
      setFormLoading(false);
    }
  }, [ruleToDelete, refetch]);


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
      {successMessage && <Alert type="success" className="my-4">{successMessage}</Alert>}
      {loading && <Loader text="Загрузка правил..." />}

      {!loading && !error && (
        <MappingRulesTable 
          rules={rulesData?.items || []} 
          onEdit={handleOpenEditModal} 
          onDelete={handleDeleteClick} 
        />
      )}

      {!loading && !error && rulesData?.total_count > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil((rulesData.total_count || 0) / ITEMS_PER_PAGE)}
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
          {/* ... содержимое формы без изменений ... */}
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Удалить правило?"
        message={`Вы уверены, что хотите удалить правило '${ruleToDelete?.keyword}'?`}
        loading={formLoading}
      />
    </div>
  );
}

export default MappingRulesPage;