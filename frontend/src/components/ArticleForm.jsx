// frontend/src/components/ArticleForm.jsx
import { useState, useEffect, useCallback } from 'react';
// Button здесь больше не нужен, т.к. кнопки вынесены в Modal на странице
import Alert from './Alert';
import Loader from './Loader';
import { apiService, ApiError } from '../services/apiService';

// Проп onCancelEdit удален, так как кнопка "Отмена" теперь внешняя (в футере модального окна)
function ArticleForm({ formId, onArticleCreated, articleToEdit }) {
  const [name, setName] = useState('');
  const [articleType, setArticleType] = useState('expense');
  const [parentId, setParentId] = useState('');
  const [isArchived, setIsArchived] = useState(false);

  const [availableParents, setAvailableParents] = useState([]);
  const [isParentsLoading, setIsParentsLoading] = useState(false);
  const [fetchParentsError, setFetchParentsError] = useState(null);

  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // isLoading для процесса submit

  const isEditMode = Boolean(articleToEdit);

  useEffect(() => {
    if (isEditMode && articleToEdit) {
      setName(articleToEdit.name);
      setArticleType(articleToEdit.article_type);
      setParentId(articleToEdit.parent_id === null ? '' : String(articleToEdit.parent_id));
      setIsArchived(articleToEdit.is_archived);
    } else {
      setName('');
      setArticleType('expense');
      setParentId('');
      setIsArchived(false);
    }
  }, [articleToEdit, isEditMode]);

  const fetchParentArticles = useCallback(async () => {
    setIsParentsLoading(true);
    setFetchParentsError(null);
    try {
      const data = await apiService.get('/articles/');
      const articlesData = Array.isArray(data) ? data : [];

      const flattenArticles = (articles, level = 0, currentArticleId = null) => {
        let flatList = [];
        articles.forEach(article => {
          if (currentArticleId === article.id) return;
          flatList.push({
            ...article,
            displayName: `${'—'.repeat(level)} ${article.name}`
          });
          if (article.children && article.children.length > 0) {
            flatList = flatList.concat(flattenArticles(article.children, level + 1, currentArticleId));
          }
        });
        return flatList;
      };
      setAvailableParents(flattenArticles(articlesData, 0, articleToEdit ? articleToEdit.id : null));
    } catch (err) {
      console.error("ArticleForm: Ошибка при загрузке родительских статей:", err);
      if (err instanceof ApiError) {
        setFetchParentsError(err.message || "Не удалось загрузить родительские статьи.");
      } else {
        setFetchParentsError("Произошла неизвестная ошибка при загрузке.");
      }
    } finally {
        setIsParentsLoading(false);
    }
  }, [articleToEdit]);

  useEffect(() => {
    fetchParentArticles();
  }, [fetchParentArticles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    const payload = {
      name: name,
      article_type: articleType,
      is_archived: isArchived,
      parent_id: parentId ? parseInt(parentId, 10) : null,
    };

    try {
      if (isEditMode) {
        await apiService.put(`/articles/${articleToEdit.id}`, payload);
      } else {
        await apiService.post('/articles/', payload);
      }

      if (onArticleCreated) {
        onArticleCreated(); // Этот колбэк вызовет закрытие модалки и обновление списка на странице
      }
      // Сброс полей для режима создания не нужен здесь, т.к. форма будет перемонтирована при закрытии/открытии модалки
      // if (!isEditMode) { ... } 
      // fetchParentArticles(); // Перезагрузка родительских статей может быть не нужна сразу после submit,
      // т.к. onArticleCreated обычно приводит к перезагрузке всего списка статей на основной странице.
      // Если иерархия сильно меняется, можно раскомментировать.
    } catch (err) {
      console.error(`ArticleForm: Ошибка при ${isEditMode ? 'обновлении' : 'создании'} статьи:`, err);
      if (err instanceof ApiError) {
        setSubmitError(err.message || `Не удалось ${isEditMode ? 'обновить' : 'создать'} статью.`);
      } else {
        setSubmitError("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Убраны mb-4, p-6, bg-white, shadow-lg, rounded-lg - это теперь стили Modal.jsx
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error" message={submitError} className="mb-4" />}
      {fetchParentsError && <Alert type="warning" title="Ошибка загрузки родительских статей" message={fetchParentsError} className="mb-4" />}
      
      {/* Показываем лоадер только если нет других ошибок и идет загрузка родителей */}
      {isParentsLoading && !fetchParentsError && <Loader message="Загрузка родительских статей..." />}

      {/* Основные поля формы */}
      {!isParentsLoading && ( // Не показываем поля, пока грузятся родители, чтобы избежать проблем с выбором
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-gray-700 mb-1">
                Название статьи
              </label>
              <input
                type="text" id={`${formId}-name`} value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                disabled={isLoading} // Блокируем во время отправки формы
              />
            </div>
            <div>
              <label htmlFor={`${formId}-articleType`} className="block text-sm font-medium text-gray-700 mb-1">Тип статьи</label>
              <select id={`${formId}-articleType`} value={articleType} onChange={(e) => setArticleType(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="expense">Расход</option>
                <option value="income">Доход</option>
              </select>
            </div>
          </div>

          <div> {/* Убрал mb-4 отсюда, space-y-4 у формы теперь управляет этим */}
            <label htmlFor={`${formId}-parentId`} className="block text-sm font-medium text-gray-700 mb-1">
              Родительский раздел/статья
            </label>
            <select
                id={`${formId}-parentId`}
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isLoading || availableParents.length === 0 && !fetchParentsError} // Блокируем, если нет родителей (и нет ошибки их загрузки)
            >
              <option value="">{(!fetchParentsError && availableParents.length === 0) ? "Нет доступных родителей" : "-- Без родителя --"}</option>
              {availableParents.map(parent => (
                <option key={parent.id} value={parent.id} disabled={isEditMode && parent.id === articleToEdit.id}>
                  {parent.displayName}
                </option>
              ))}
            </select>
          </div>

          <div> {/* Убрал mb-6, используется space-y-4 */}
            <label htmlFor={`${formId}-isArchived`} className="flex items-center">
              <input
                type="checkbox" id={`${formId}-isArchived`} checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">В архиве</span>
            </label>
          </div>
        </>
      )}
      {/* Кнопки "Отмена" и "Создать/Сохранить" удалены отсюда. Они будут в футере Modal.jsx, передаваться из DdsArticlesPage.jsx */}
    </form>
  );
}

export default ArticleForm;