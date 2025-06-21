import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import ArticleNode from '../components/ArticleNode';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import ConfirmationModal from '../components/ConfirmationModal';
import { PlusIcon } from '@heroicons/react/24/solid';

function DdsArticlesPage() {
  const { activeWorkspace } = useAuth();
  const [articlesTree, setArticlesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [parentArticleId, setParentArticleId] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);

  const fetchArticlesTree = useCallback(async () => {
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiService.get(`/dds-articles/tree/?workspace_id=${activeWorkspace.id}`);
      setArticlesTree(data || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить статьи');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchArticlesTree();
  }, [fetchArticlesTree]);

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
    fetchArticlesTree();
  };
  const handleDeleteRequest = (article) => {
    setArticleToDelete(article);
  };
  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    try {
      await apiService.delete(`/dds-articles/${articleToDelete.id}`);
      setArticleToDelete(null);
      fetchArticlesTree();
    } catch (err) {
      setError(err.message || 'Не удалось удалить статью');
      setArticleToDelete(null);
    }
  };

  const renderContent = () => {
    if (loading) return <div className="flex justify-center p-8"><Loader /></div>;
    if (error) return <Alert type="error">{error}</Alert>;
    if (articlesTree.length === 0) {
      return <EmptyState message="У вас еще нет ни одной статьи ДДС." buttonText="Создать первую статью" onButtonClick={handleOpenCreateRootModal} />;
    }
    return (
      <div className="bg-white p-4 rounded-xl shadow-md">
        {articlesTree.map(article => (
          <ArticleNode key={article.id} article={article} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} onAddSubArticle={handleOpenAddSubArticleModal} />
        ))}
      </div>
    );
  };

  return (
    <Fragment>
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Статьи доходов и расходов" />
        <Button onClick={handleOpenCreateRootModal} icon={<PlusIcon className="h-5 w-5 mr-2" />}>Добавить статью</Button>
      </div>
      {renderContent()}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={articleToEdit ? 'Редактировать статью' : 'Новая статья'}>
        <ArticleForm articleToEdit={articleToEdit} parentId={parentArticleId} onSuccess={handleCloseModal} />
      </Modal>
      <ConfirmationModal isOpen={Boolean(articleToDelete)} onClose={() => setArticleToDelete(null)} onConfirm={handleDeleteConfirm} title="Удалить статью" message={`Вы уверены, что хотите удалить статью "${articleToDelete?.name}"? Все дочерние статьи также будут удалены.`} />
    </Fragment>
  );
}
export default DdsArticlesPage;