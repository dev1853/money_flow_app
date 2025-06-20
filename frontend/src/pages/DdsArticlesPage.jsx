// frontend/src/pages/DdsArticlesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import ArticleNode from '../components/ArticleNode';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import ConfirmationModal from '../components/ConfirmationModal'; // <-- Убедитесь, что он импортирован
import { PlusIcon } from '@heroicons/react/24/solid';


function DdsArticlesPage() {
  const { activeWorkspace } = useAuth();
  const [articlesTree, setArticlesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [parentArticleId, setParentArticleId] = useState(null); // Для создания подстатьи
 
   // --- НОВОЕ СОСТОЯНИЕ И ОБРАБОТЧИКИ ДЛЯ УДАЛЕНИЯ ---
  const [articleToDelete, setArticleToDelete] = useState(null);

  const handleDeleteRequest = (article) => {
    setArticleToDelete(article); // Открывает окно подтверждения
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    try {
      // Отправляем запрос на удаление на бэкенд
      await apiService.delete(`/dds-articles/${articleToDelete.id}`);
      setArticleToDelete(null); // Закрываем окно подтверждения
      fetchArticlesTree(); // Обновляем дерево статей
    } catch (err) {
      setError(err.message || 'Не удалось удалить статью');
      setArticleToDelete(null); // Закрываем окно даже в случае ошибки
    }
  };
  // ----------------------------------------------------

  const fetchArticlesTree = useCallback(async () => {
    // Если нет активного воркспейса, нечего грузить
    if (!activeWorkspace) {
      setLoading(false); // Просто выключаем лоадер
      return;
    }

    setLoading(true);
    setError(''); // Сбрасываем старые ошибки при новой загрузке

    try {
      const data = await apiService.get(`/dds-articles/tree/?workspace_id=${activeWorkspace.id}`);
      setArticlesTree(data || []);
    } catch (err) {
      console.error("DdsArticlesPage: Ошибка при загрузке статей:", err);
      setError(err.message || 'Не удалось загрузить статьи');
      setArticlesTree([]); // В случае ошибки показываем пустой список
    } finally {
      // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
      // Этот блок выполнится всегда: и после `try`, и после `catch`.
      setLoading(false);
    }
  }, [activeWorkspace])

  useEffect(() => { fetchArticlesTree(); }, [fetchArticlesTree]);

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---
  const handleOpenCreateRootModal = () => {
    setArticleToEdit(null); // Режим создания
    setParentArticleId(null); // Корневая статья
    setIsModalOpen(true);
  };

  const handleOpenAddSubArticleModal = (parentId) => {
    setArticleToEdit(null); // Режим создания
    setParentArticleId(parentId); // Указываем родителя
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article) => {
    setArticleToEdit(article); // Режим редактирования
    setParentArticleId(null); // parentId не нужен, он есть в самом article
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setArticleToEdit(null);
    setParentArticleId(null);
    fetchArticlesTree(); // Обновляем дерево после любого действия
  };
  

  const renderContent = () => {
    if (loading) return <Loader text="Загрузка статей..." />;
    if (error) return <Alert type="error">{error}</Alert>;
    if (articlesTree.length === 0) {
      return <EmptyState message="Нет статей ДДС." buttonText="Создать первую статью" onButtonClick={handleOpenCreateRootModal} />;
    }
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        {articlesTree.map(article => (
          <ArticleNode 
            key={article.id}
            article={article}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteRequest}
            onAddSubArticle={handleOpenAddSubArticleModal} // Используем новый обработчик
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Статьи Движения Денежных Средств (ДДС)" />
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