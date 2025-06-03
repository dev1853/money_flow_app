// frontend/src/pages/DdsArticlesPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import ArticleNode from '../components/ArticleNode';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

// Наши UI компоненты и сервис
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { apiService, ApiError } from '../services/apiService';

import { PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid';

const DdsArticlesPage = () => {
  const [articles, setArticles] = useState([]); //
  const [error, setError] = useState(null); //
  const [isLoading, setIsLoading] = useState(true); //

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

  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth(); //
  const navigate = useNavigate(); //

  const ARTICLE_FORM_ID = "article-form-in-modal";

  const fetchArticles = useCallback(async () => { //
    if (isAuthLoading) { setIsLoading(true); return; }
    if (!isAuthenticated) {
      setError('Для доступа к этой странице необходимо войти в систему.');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    setIsLoading(true); //
    setError(null); //
    try {
      const data = await apiService.get('/articles/');
      setArticles(data || []); //
    } catch (e) { //
      console.error("DdsArticlesPage: Ошибка при загрузке статей:", e); //
      if (e instanceof ApiError) {
        if (e.status === 401) {
            setError('Сессия истекла. Пожалуйста, войдите снова.');
            logout();
        } else {
            setError(e.message || "Не удалось загрузить статьи.");
        }
      } else {
        setError("Произошла неизвестная ошибка при загрузке статей.");
      }
      setArticles([]);
    } finally {
      setIsLoading(false); //
    }
  }, [isAuthenticated, isAuthLoading, navigate, logout]); //

  useEffect(() => { //
    if (!isAuthLoading) {
        fetchArticles();
    }
  }, [fetchArticles, isAuthLoading]); //

  const handleOpenCreateModal = () => { //
    setEditingArticle(null);
    setError(null); // Сбрасываем ошибку перед открытием модалки
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (article) => { //
    setEditingArticle(article);
    setError(null); // Сбрасываем ошибку перед открытием модалки
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => { //
    setIsFormModalOpen(false);
    setEditingArticle(null);
    setError(null); // Также сбрасываем ошибку при закрытии
  };

  const handleFormSubmitSuccess = () => { //
    fetchArticles();
    handleCloseFormModal(); // Используем единую функцию для закрытия и сброса
  };

  const handleArchiveArticle = async (articleToToggle) => { //
    const newArchivedState = !articleToToggle.is_archived;
    const actionText = newArchivedState ? 'архивировать' : 'разархивировать';
    setError(null);

    setConfirmModalProps({ //
      title: "Подтверждение", //
      message: `Вы уверены, что хотите ${actionText} статью "${articleToToggle.name}"?`, //
      confirmText: newArchivedState ? "Архивировать" : "Разархивировать", //
      confirmButtonVariant: "primary", //
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const payload = { //
            name: articleToToggle.name,
            article_type: articleToToggle.article_type,
            parent_id: articleToToggle.parent_id,
            is_archived: newArchivedState
          };
          await apiService.put(`/articles/${articleToToggle.id}`, payload);
          fetchArticles();
        } catch (err) { //
          console.error("DdsArticlesPage: Ошибка архивации", err);
          setError(err instanceof ApiError ? err.message : `Не удалось ${actionText} статью`);
        } finally {
            setIsLoading(false);
        }
      }
    });
    setIsConfirmModalOpen(true); //
  };

  const handleDeleteArticle = async (articleToDelete) => { //
    setError(null);
    setConfirmModalProps({ //
      title: "Подтверждение удаления", //
      message: `ВЫ УВЕРЕНЫ, что хотите ПОЛНОСТЬЮ УДАЛИТЬ статью "${articleToDelete.name}"?\n\nЭто действие необратимо.`, //
      confirmText: "Удалить", //
      confirmButtonVariant: "danger", //
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await apiService.del(`/articles/${articleToDelete.id}`);
          fetchArticles();
        } catch (err) { //
          console.error("DdsArticlesPage: Ошибка удаления", err);
          setError(err instanceof ApiError ? err.message : 'Не удалось удалить статью');
        } finally {
            setIsLoading(false);
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
  
  const articleFormFooter = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={handleCloseFormModal}>
        Отмена
      </Button>
      <Button
        type="submit"
        form={ARTICLE_FORM_ID}
        variant="primary"
        size="md"
        // isLoading из ArticleForm теперь внутренний, и эта кнопка не знает о нем напрямую.
        // Если isLoading относится к отправке формы в ArticleForm, ArticleForm сам заблокирует поля.
        // Если isLoading здесь относится к isLoading страницы (например, во время других операций), то можно его использовать:
        // disabled={isLoading} 
      >
        {editingArticle ? 'Сохранить изменения' : 'Создать статью'}
      </Button>
    </div>
  );

  return (
    <>
      <PageTitle
        title="Статьи ДДС"
        titleClassName="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight" //
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal} //
            disabled={!isAuthenticated || isAuthLoading} // Добавили isAuthLoading для надежности
            iconLeft={<PlusIcon className="h-5 w-5" />} //
            className="w-full sm:w-auto" //
          >
            <span className="truncate">Добавить статью</span> {/* */}
          </Button>
        }
      />

      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen} //
          onClose={handleCloseFormModal} //
          title={editingArticle ? `Редактировать: ${editingArticle.name}` : "Добавить новую статью ДДС"} //
          footer={articleFormFooter}
          maxWidth="max-w-2xl"
        >
          <ArticleForm
            formId={ARTICLE_FORM_ID}
            onArticleCreated={handleFormSubmitSuccess} //
            articleToEdit={editingArticle} //
            key={editingArticle ? `edit-article-${editingArticle.id}` : 'create-article'} //
          />
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen} //
        onClose={() => { setIsConfirmModalOpen(false); setError(null); }} // Сбрасываем ошибку при закрытии
        {...confirmModalProps} //
      />

      <div className="mt-6">
        {/* Лоадер для первоначальной загрузки списка */}
        {isLoading && articles.length === 0 && !isAuthLoading && (
            <Loader message="Загрузка статей..." containerClassName="text-center py-10" />
        )}

        {/* Ошибка при первоначальной загрузке списка */}
        {!isLoading && error && articles.length === 0 && (
          <Alert type="error" title="Ошибка загрузки данных" message={error} className="my-4" />
        )}
        
        {/* Ошибка операции, если список уже был загружен */}
        {!isLoading && error && articles.length > 0 && (
            <Alert type="error" title="Ошибка операции" message={error} className="my-4" />
        )}


        {!isLoading && !error && articles.length === 0 && ( //
          <EmptyState
            icon={<DocumentDuplicateIcon />} //
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
          <div className="space-y-0.5 bg-white p-4 shadow-md rounded-lg"> {/* */}
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