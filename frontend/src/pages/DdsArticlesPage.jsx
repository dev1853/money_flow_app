// frontend/src/pages/DdsArticlesPage.jsx
import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useDataFetching } from '../hooks/useDataFetching'; // Наш хук

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import ArticleNode from '../components/ArticleNode';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ArticleForm from '../components/forms/ArticleForm';
import ConfirmationModal from '../components/ConfirmationModal';
import { PlusIcon } from '@heroicons/react/24/solid';


function DdsArticlesPage() {
  const { activeWorkspace } = useAuth();
  
  // Состояния для UI (модальные окна) остаются в компоненте
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [parentArticleId, setParentArticleId] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);

  // --- РЕФАКТОРИНГ ЛОГИКИ ЗАГРУЗКИ ---
  
  // 1. Определяем функцию для запроса дерева статей
  const fetchArticles = useCallback(async () => {
    return await apiService.getDdsArticles(activeWorkspace.id);
  }, [activeWorkspace]);

  // 2. Используем наш хук для загрузки данных
  const { 
    data: articlesTree, // Переименовываем data для удобства
    loading, 
    error, 
    refetch 
  } = useDataFetching(fetchArticles, [activeWorkspace], { skip: !activeWorkspace });

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---

  const handleOpenCreateRootModal = () => {
    setArticleToEdit(null);
    setParentArticleId(null);
    setIsModalOpen(true);
  };

  const handleOpenAddSubArticleModal = (parentId) => {
    setArticleToEdit(null);
    setParentArticleId(parentId);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article) => {
    setArticleToEdit(article);
    setParentArticleId(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setArticleToEdit(null);
    setParentArticleId(null);
    refetch(); // <-- Обновляем дерево после любого действия в модальном окне
  };

  const handleDeleteRequest = (article) => {
    setArticleToDelete(article);
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    try {
      await apiService.deleteDdsArticle(articleToDelete.id);
      setArticleToDelete(null);
      refetch(); // <-- Обновляем дерево после удаления
    } catch (err) {
      // Здесь можно установить состояние ошибки для Alert
      console.error('Не удалось удалить статью:', err);
      setArticleToDelete(null);
    }
  };

  const renderContent = () => {
    if (loading) return <Loader text="Загрузка статей..." />;
    if (error) return <Alert type="error">{error}</Alert>;
    // Используем articlesTree, который нам вернул хук (с || [] на случай, если он null)
    if (!articlesTree || articlesTree.length === 0) {
      return <EmptyState message="Нет статей ДДС." buttonText="Создать первую статью" onButtonClick={handleOpenCreateRootModal} />;
    }
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {(articlesTree || []).map(article => (
          <ArticleNode 
            key={article.id}
            article={article}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteRequest}
            onAddSubArticle={handleOpenAddSubArticleModal}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="dark:text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Статьи ДДС" />
        <Button onClick={handleOpenCreateRootModal} icon={<PlusIcon className="h-5 w-5 mr-2" />}>
          Добавить корневую статью
        </Button>
      </div>
      
      {renderContent()}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={articleToEdit ? 'Редактировать статью' : 'Новая статья'}>
        <ArticleForm 
          articleToEdit={articleToEdit}
          parentId={parentArticleId}
          onSuccess={handleCloseModal} 
          articlesTree={articlesTree}
        />
      </Modal>
      <ConfirmationModal
        isOpen={Boolean(articleToDelete)}
        onClose={() => setArticleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить статью"
        message={`Вы уверены, что хотите удалить статью "${articleToDelete?.name}"? Это действие необратимо.`}
      />
    </div>
  );
}

export default DdsArticlesPage;