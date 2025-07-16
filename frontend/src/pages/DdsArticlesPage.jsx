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
    const { activeWorkspace, loading: authLoading } = useAuth(); // Добавим authLoading для skip
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [articleToEdit, setArticleToEdit] = useState(null);
    const [parentArticleId, setParentArticleId] = useState(null);
    const [articleToDelete, setArticleToDelete] = useState(null);

    const fetchArticles = useCallback(async () => {
        // Добавим проверку на случай, если activeWorkspace или его id еще не определены
        if (!activeWorkspace?.id) return null;

        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Передаем ID в виде объекта, как того ожидает наш apiService
        return await apiService.getDdsArticles({ workspace_id: activeWorkspace.id });
    }, [activeWorkspace?.id]); // Зависимость от ID, а не всего объекта для стабильности

    const { 
        data: articlesTree,
        loading, 
        error, 
        refetch 
    } = useDataFetching(
        fetchArticles, 
        [activeWorkspace?.id], // Зависимость от ID
        { skip: authLoading || !activeWorkspace?.id } // Пропускаем запрос, пока нет ID
    );

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
        refetch();
    };

    const handleDeleteRequest = (article) => {
        setArticleToDelete(article);
    };

    const handleDeleteConfirm = async () => {
        if (!articleToDelete) return;
        try {
            await apiService.deleteDdsArticle(articleToDelete.id);
            setArticleToDelete(null);
            refetch();
        } catch (err) {
            console.error('Не удалось удалить статью:', err);
            setArticleToDelete(null);
        }
    };

    const handleCreateDdsArticle = async (articleData) => {
      return await apiService.createDdsArticle(articleData, { workspace_id: activeWorkspace?.id });
    };

    const renderContent = () => {
        if (loading || authLoading) return <Loader text="Загрузка статей..." />;
        if (error) return <Alert type="error">{error.message}</Alert>;
        
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
                <Button onClick={handleOpenCreateRootModal}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Добавить корневую статью
                </Button>
            </div>
            
            {renderContent()}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={articleToEdit ? 'Редактировать статью' : 'Новая статья'}>
                <ArticleForm 
                    articleToEdit={articleToEdit}
                    parentId={parentArticleId}
                    onSuccess={handleCloseModal} 
                    articlesTree={articlesTree || []}
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