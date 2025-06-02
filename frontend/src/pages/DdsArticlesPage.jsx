// src/pages/DdsArticlesPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react'; // Добавил Fragment для ConfirmationModal/Modal
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import ArticleNode from '../components/ArticleNode';
import ConfirmationModal from '../components/ConfirmationModal';
import { PlusIcon, DocumentDuplicateIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'; // Используем solid для консистентности с другими кнопками
import { useAuth } from '../contexts/AuthContext';

const DdsArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Локальная загрузка для статей
  
  const [editingArticle, setEditingArticle] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); 

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    message: '',
    onConfirm: () => {},
    title: "Подтверждение",
    confirmText: "Да",
    confirmButtonVariant: "primary"
  });

  // Получаем состояние аутентификации и токен из AuthContext
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Определение общих классов для кнопок (если будете их использовать)
  const commonButtonMainClass = "inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10";


  const fetchArticles = useCallback(async () => {
    if (isAuthLoading) { // Если AuthContext еще проверяет аутентификацию, ждем
      setIsLoading(true); // Показываем общую загрузку
      return;
    }
    if (!isAuthenticated || !token) { // Если не аутентифицирован, перенаправляем
      setError('Для доступа к этой странице необходимо войти в систему.');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` }; // Добавляем токен
      const response = await fetch('http://localhost:8000/articles/', { headers });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Ошибка сервера");
        if (response.status === 401) {
            setError('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.');
            navigate('/login'); // Редирект при 401
        } else {
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        setArticles([]); // Очищаем статьи в случае ошибки
        return;
      }
      const data = await response.json();
      setArticles(data);
    } catch (e) {
      setError(e.message);
      console.error("DdsArticlesPage: Ошибка при загрузке статей:", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    // Запускаем fetchArticles только когда isAuthLoading станет false
    if (!isAuthLoading) {
        fetchArticles();
    }
  }, [fetchArticles, isAuthLoading]);

  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (article) => {
    setEditingArticle(article);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingArticle(null); 
  };
  
  const handleFormSubmitSuccess = () => {
    fetchArticles();
    setIsFormModalOpen(false);
    setEditingArticle(null);
  };

  const handleArchiveArticle = async (articleToToggle) => {
    const newArchivedState = !articleToToggle.is_archived;
    const actionText = newArchivedState ? 'архивировать' : 'разархивировать';
    
    setConfirmModalProps({
      title: "Подтверждение",
      message: `Вы уверены, что хотите ${actionText} статью "${articleToToggle.name}"?`,
      confirmText: newArchivedState ? "Архивировать" : "Разархивировать",
      confirmButtonVariant: "primary",
      onConfirm: async () => {
        try {
          setError(null);
          const payload = { // Формируем payload только с полями, которые есть в DdsArticleUpdate
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
    setIsConfirmModalOpen(true);
  };

  const handleDeleteArticle = async (articleToDelete) => {
    setConfirmModalProps({
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
    setIsConfirmModalOpen(true);
  };

  // Состояние загрузки для всего компонента, пока проверяется аутентификация
  if (isAuthLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-500">Проверка аутентификации...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
          Статьи ДДС
        </h2>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          disabled={!isAuthenticated} // Используем isAuthenticated из useAuth()
          className={`${commonButtonMainClass} text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 w-full sm:w-auto`}
        >
          <PlusIcon className="-ml-0.5 h-5 w-5 mr-1 sm:mr-2" aria-hidden="true" />
          <span className="truncate">Добавить статью</span>
        </button>
      </div>
      
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={handleCloseFormModal} 
        title={editingArticle ? `Редактировать: ${editingArticle.name}` : "Добавить новую статью ДДС"}
      >
        <ArticleForm 
          onArticleCreated={handleFormSubmitSuccess}
          articleToEdit={editingArticle}
          onCancelEdit={handleCloseFormModal}
          key={editingArticle ? `edit-article-${editingArticle.id}` : 'create-article'} 
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        onConfirm={confirmModalProps.onConfirm}
        confirmText={confirmModalProps.confirmText}
        cancelText="Отмена"
        confirmButtonVariant={confirmModalProps.confirmButtonVariant}
      />
      
      <div className="mt-8">
        {isLoading && ( // Локальная загрузка списка статей
            <div className="text-center py-10 text-gray-500">
                 <svg className="mx-auto h-10 w-10 animate-spin text-indigo-500" /* ...spinner svg... */></svg>
                 <p className="mt-2 text-sm">Загрузка статей...</p>
            </div>
        )}
        
        {!isLoading && error && (
          <div className="rounded-md bg-red-50 p-4 my-4 shadow">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка загрузки данных</h3>
                <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && articles.length === 0 && (
          <div className="text-center py-16 bg-white shadow-lg rounded-xl">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Статей пока нет</h3>
            <p className="mt-1 text-sm text-gray-500">Начните с добавления новой статьи.</p>
          </div>
        )}

        {!isLoading && !error && articles.length > 0 && (
          <div className="space-y-0.5">
            {articles.map((rootArticle) => (
              <ArticleNode 
                key={rootArticle.id} 
                article={rootArticle} 
                level={0} 
                onEdit={handleOpenEditModal}
                onArchive={handleArchiveArticle} 
                onDelete={handleDeleteArticle}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DdsArticlesPage;