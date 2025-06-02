// src/pages/DdsArticlesPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal'; //
import ArticleForm from '../components/ArticleForm'; //
import ArticleNode from '../components/ArticleNode'; //
import ConfirmationModal from '../components/ConfirmationModal'; //
import { useAuth } from '../contexts/AuthContext'; //

// Наши новые компоненты
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

import { PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid'; // ExclamationTriangleIcon убран, т.к. Alert его содержит

const DdsArticlesPage = () => {
  const [articles, setArticles] = useState([]); //
  const [error, setError] = useState(null); //
  const [isLoading, setIsLoading] = useState(true); // Локальная загрузка для статей

  const [editingArticle, setEditingArticle] = useState(null); //
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); //

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); //
  const [confirmModalProps, setConfirmModalProps] = useState({ //
    message: '',
    onConfirm: () => {},
    title: "Подтверждение",
    confirmText: "Да",
    confirmButtonVariant: "primary"
  });

  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth(); //
  const navigate = useNavigate(); //

  const fetchArticles = useCallback(async () => { //
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    if (!isAuthenticated || !token) {
      setError('Для доступа к этой странице необходимо войти в систему.');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    setIsLoading(true); //
    setError(null); //
    try {
      const headers = { 'Authorization': `Bearer ${token}` }; //
      const response = await fetch('http://localhost:8000/articles/', { headers }); //
      if (!response.ok) { //
        const errorText = await response.text().catch(() => "Ошибка сервера");
        if (response.status === 401) {
            setError('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.');
            navigate('/login');
        } else {
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        setArticles([]);
        return;
      }
      const data = await response.json(); //
      setArticles(data); //
    } catch (e) { //
      setError(e.message);
      console.error("DdsArticlesPage: Ошибка при загрузке статей:", e); //
    } finally {
      setIsLoading(false); //
    }
  }, [token, isAuthenticated, isAuthLoading, navigate]); //

  useEffect(() => { //
    if (!isAuthLoading) {
        fetchArticles();
    }
  }, [fetchArticles, isAuthLoading]); //

  const handleOpenCreateModal = () => { //
    setEditingArticle(null); //
    setIsFormModalOpen(true); //
  };

  const handleOpenEditModal = (article) => { //
    setEditingArticle(article); //
    setIsFormModalOpen(true); //
  };

  const handleCloseFormModal = () => { //
    setIsFormModalOpen(false); //
    setEditingArticle(null); //
  };

  const handleFormSubmitSuccess = () => { //
    fetchArticles(); //
    setIsFormModalOpen(false); //
    setEditingArticle(null); //
  };

  const handleArchiveArticle = async (articleToToggle) => { //
    const newArchivedState = !articleToToggle.is_archived;
    const actionText = newArchivedState ? 'архивировать' : 'разархивировать';

    setConfirmModalProps({ //
      title: "Подтверждение",
      message: `Вы уверены, что хотите ${actionText} статью "${articleToToggle.name}"?`,
      confirmText: newArchivedState ? "Архивировать" : "Разархивировать",
      confirmButtonVariant: "primary",
      onConfirm: async () => {
        try {
          setError(null);
          const payload = {
            name: articleToToggle.name,
            article_type: articleToToggle.article_type,
            parent_id: articleToToggle.parent_id,
            is_archived: newArchivedState
          };
          const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`};

          const response = await fetch(`http://localhost:8000/articles/${articleToToggle.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({detail: `Не удалось ${actionText} статью`}));
            throw new Error(errorData.detail || `Не удалось ${actionText} статью`);
          }
          fetchArticles();
        } catch (err) {
          setError(err.message || `Ошибка при ${actionText}`);
        }
      }
    });
    setIsConfirmModalOpen(true); //
  };

  const handleDeleteArticle = async (articleToDelete) => { //
    setConfirmModalProps({ //
      title: "Подтверждение удаления",
      message: `ВЫ УВЕРЕНЫ, что хотите ПОЛНОСТЬЮ УДАЛИТЬ статью "${articleToDelete.name}"?\n\nЭто действие необратимо.`,
      confirmText: "Удалить",
      confirmButtonVariant: "danger",
      onConfirm: async () => {
        try {
          setError(null);
          const headers = { 'Authorization': `Bearer ${token}`};
          const response = await fetch(`http://localhost:8000/articles/${articleToDelete.id}`, {
            method: 'DELETE',
            headers: headers,
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({detail: 'Не удалось удалить статью'}));
            throw new Error(errorData.detail || 'Не удалось удалить статью');
          }
          fetchArticles();
        } catch (err) {
          setError(err.message || 'Ошибка при удалении');
        }
      }
    });
    setIsConfirmModalOpen(true); //
  };

  if (isAuthLoading) { //
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]"> {/* */}
        <Loader message="Проверка аутентификации..." />
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Статьи ДДС"
        titleClassName="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight" // Сохраняем оригинальные стили заголовка
        actions={
          <Button
            variant="primary"
            size="md" // Оригинальный класс h-10, px-3 py-2
            onClick={handleOpenCreateModal} //
            disabled={!isAuthenticated} //
            iconLeft={<PlusIcon className="h-5 w-5" />} //
            className="w-full sm:w-auto" //
          >
            <span className="truncate">Добавить статью</span> {/* */}
          </Button>
        }
      />

      <Modal
        isOpen={isFormModalOpen} //
        onClose={handleCloseFormModal} //
        title={editingArticle ? `Редактировать: ${editingArticle.name}` : "Добавить новую статью ДДС"} //
      >
        <ArticleForm
          onArticleCreated={handleFormSubmitSuccess} //
          articleToEdit={editingArticle} //
          onCancelEdit={handleCloseFormModal} //
          key={editingArticle ? `edit-article-${editingArticle.id}` : 'create-article'} //
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen} //
        onClose={() => setIsConfirmModalOpen(false)} //
        title={confirmModalProps.title} //
        message={confirmModalProps.message} //
        onConfirm={confirmModalProps.onConfirm} //
        confirmText={confirmModalProps.confirmText} //
        cancelText="Отмена" //
        confirmButtonVariant={confirmModalProps.confirmButtonVariant} //
      />

      <div className="mt-8"> {/* */}
        {isLoading && !isAuthLoading && ( // Показываем лоадер статей, только если проверка auth завершена
            <Loader message="Загрузка статей..." containerClassName="text-center py-10" /> //
        )}

        {!isLoading && error && ( //
          <Alert type="error" title="Ошибка загрузки данных" message={error} className="my-4" /> //
        )}

        {!isLoading && !error && articles.length === 0 && ( //
          <EmptyState
            icon={DocumentDuplicateIcon} //
            title="Статей пока нет" //
            message="Начните с добавления новой статьи." //
            actionButton={
                <Button variant="primary" onClick={handleOpenCreateModal} iconLeft={<PlusIcon className="h-5 w-5"/>}>
                    Добавить первую статью
                </Button>
            }
          />
        )}

        {!isLoading && !error && articles.length > 0 && ( //
          <div className="space-y-0.5"> {/* */}
            {articles.map((rootArticle) => ( //
              <ArticleNode
                key={rootArticle.id} //
                article={rootArticle} //
                level={0} //
                onEdit={handleOpenEditModal} //
                onArchive={handleArchiveArticle} //
                onDelete={handleDeleteArticle} //
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DdsArticlesPage; //