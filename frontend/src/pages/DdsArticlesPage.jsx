// frontend/src/pages/DdsArticlesPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// UI Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import ArticleNode from '../components/ArticleNode';
import ConfirmationModal from '../components/ConfirmationModal';

import { PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid';

const DdsArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flatArticles, setFlatArticles] = useState([]); // Для списка родительских статей

  // Состояния для модальных окон
  const [editingArticle, setEditingArticle] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    message: '',
    onConfirm: () => {},
  });
  // Состояние для isSubmitting из формы
  const [isArticleFormSubmitting, setIsArticleFormSubmitting] = useState(false);

  const { activeWorkspace } = useAuth();

  // Определяем уникальный ID для формы статьи
  const ARTICLE_FORM_ID = "articleForm";

  const fetchArticles = useCallback(async () => {
    if (!activeWorkspace) {
      setArticles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ workspace_id: activeWorkspace.id });
      const data = await apiService.get(`/dds_articles?${params.toString()}`);
      setArticles(data);
      // FlattenArticles for parent selection
      const flatten = (articles, level = 0) => {
          let result = [];
          articles.forEach(art => {
              // Включаем детей в flatArticles, чтобы их можно было фильтровать из списка родителей
              result.push({ ...art, level }); // Передаем все свойства статьи
              if (art.children && art.children.length > 0) {
                  result = result.concat(flatten(art.children, level + 1));
              }
          });
          return result;
      };
      setFlatArticles(flatten(data));
    } catch (err) {
      console.error("DdsArticlesPage: Ошибка при загрузке статей:", err);
      setError("Не удалось загрузить статьи. " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleOpenCreateModal = (parentId = null) => {
    setEditingArticle({ parent_id: parentId });
    setIsFormModalOpen(true);
    setIsArticleFormSubmitting(false); // Сброс состояния отправки
  };

  const handleOpenEditModal = (article) => {
    setEditingArticle(article);
    setIsFormModalOpen(true);
    setIsArticleFormSubmitting(false); // Сброс состояния отправки
  };
  
  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingArticle(null);
    setIsArticleFormSubmitting(false);
  };

  const handleFormSuccess = () => {
    handleCloseFormModal();
    fetchArticles();
  };

  // Эта функция будет вызвана из ArticleForm для обновления состояния отправки
  const handleSetArticleFormSubmitting = (isSubmitting) => {
    setIsArticleFormSubmitting(isSubmitting);
  };
  
  const handleDeleteArticle = (article) => {
    setConfirmModalProps({
        title: "Подтвердите удаление",
        message: `Вы уверены, что хотите удалить статью "${article.name}"? Это действие необратимо.`,
        confirmText: "Удалить",
        confirmButtonVariant: "danger",
        onConfirm: async () => {
            try {
                const params = new URLSearchParams({ workspace_id: activeWorkspace.id });
                await apiService.delete(`/dds_articles/${article.id}?${params.toString()}`);
                fetchArticles();
            } catch (err) {
                setError(err.message);
            }
            setIsConfirmModalOpen(false);
        }
    });
    setIsConfirmModalOpen(true);
  };

  // Футер для модального окна ArticleForm
  const modalFooter = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={handleCloseFormModal} disabled={isArticleFormSubmitting}>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        form={ARTICLE_FORM_ID} // Связываем кнопку с формой по ID
        disabled={isArticleFormSubmitting} // Управляем состоянием кнопки извне формы
      >
        {isArticleFormSubmitting ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  );


  if (isLoading) {
    return <Loader message="Загрузка статей..." />;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Статьи ДДС" />
        <Button 
            onClick={() => handleOpenCreateModal()} 
            variant="primary"
            disabled={!activeWorkspace}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить статью
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="my-4" />}

      {!activeWorkspace && !isLoading && (
        <EmptyState
          icon={<DocumentDuplicateIcon />}
          title="Рабочее пространство не выбрано"
          message="Пожалуйста, выберите или создайте рабочее пространство для работы со статьями."
        />
      )}

      {activeWorkspace && articles.length === 0 && !error && (
        <EmptyState
          icon={<DocumentDuplicateIcon />}
          title="Статей пока нет"
          message="Начните с добавления корневой статьи, например, 'Доходы' или 'Расходы'."
          actionButton={
            <Button variant="primary" onClick={() => handleOpenCreateModal()} iconLeft={<PlusIcon className="h-5 w-5"/>}>
              Добавить первую статью
            </Button>
          }
        />
      )}

      {activeWorkspace && articles.length > 0 && (
        <div className="space-y-1 bg-white p-4 shadow-md rounded-lg">
          {articles.map((rootArticle) => (
            <ArticleNode
              key={rootArticle.id}
              article={rootArticle}
              level={0}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteArticle}
              onAddSubArticle={handleOpenCreateModal} // Если есть такая кнопка в ArticleNode
            />
          ))}
        </div>
      )}

      {/* Модальное окно для формы */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={handleCloseFormModal} 
        title={editingArticle && editingArticle.id ? 'Редактировать статью' : 'Новая статья'}
        formId={ARTICLE_FORM_ID} // Передаем formId в Modal
        footer={modalFooter} // Передаем футер с кнопками
      >
        <ArticleForm 
          article={editingArticle}
          parentArticles={flatArticles}
          onSuccess={handleFormSuccess}
          formId={ARTICLE_FORM_ID} // Передаем formId в ArticleForm
          // onCancel больше не нужен, т.к. кнопки снаружи
        />
      </Modal>

      {/* Модальное окно для подтверждений */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        {...confirmModalProps}
      />
    </>
  );
};

export default DdsArticlesPage;