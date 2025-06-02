// src/components/ArticleForm.jsx
import { useState, useEffect, useCallback } from 'react';

// Добавляем articleToEdit и onCancelEdit в props
function ArticleForm({ onArticleCreated, articleToEdit, onCancelEdit }) {
  const [name, setName] = useState('');
  const [articleType, setArticleType] = useState('expense');
  const [parentId, setParentId] = useState('');
  const [isArchived, setIsArchived] = useState(false); // Добавим для редактирования
  
  const [availableParents, setAvailableParents] = useState([]);
  const [fetchParentsError, setFetchParentsError] = useState(null);
  
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(articleToEdit); // Определяем, это режим редактирования?

  // Заполняем форму, если передана статья для редактирования
  useEffect(() => {
    if (isEditMode && articleToEdit) {
      setName(articleToEdit.name);
      setArticleType(articleToEdit.article_type);
      setParentId(articleToEdit.parent_id === null ? '' : String(articleToEdit.parent_id));
      setIsArchived(articleToEdit.is_archived);
    } else {
      // Сброс формы, если вышли из режима редактирования или это форма создания
      setName('');
      setArticleType('expense');
      setParentId('');
      setIsArchived(false);
    }
  }, [articleToEdit, isEditMode]);


  const fetchParentArticles = useCallback(async () => {
    // ... (код fetchParentArticles без изменений)
    try {
      setFetchParentsError(null);
      const response = await fetch('http://localhost:8000/articles/');
      if (!response.ok) {
        throw new Error(`Ошибка загрузки родительских статей: ${response.status}`);
      }
      const data = await response.json();
      const flattenArticles = (articles, level = 0, currentArticleId = null) => {
        let flatList = [];
        articles.forEach(article => {
          // Исключаем саму редактируемую статью и ее детей из списка родителей
          if (currentArticleId === article.id) return;

          flatList.push({ 
            ...article, 
            displayName: `${'—'.repeat(level)} ${article.name}` 
          });
          if (article.children && article.children.length > 0) {
            // Передаем currentArticleId дальше, чтобы исключить всю ветку
            flatList = flatList.concat(flattenArticles(article.children, level + 1, currentArticleId));
          }
        });
        return flatList;
      };
      setAvailableParents(flattenArticles(data, 0, articleToEdit ? articleToEdit.id : null));
    } catch (err) {
      setFetchParentsError(err.message);
      console.error("Ошибка при загрузке родительских статей:", err);
    }
  }, [articleToEdit]); // Добавляем articleToEdit в зависимости, чтобы список родителей перестраивался

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

    const url = isEditMode 
      ? `http://localhost:8000/articles/${articleToEdit.id}` 
      : 'http://localhost:8000/articles/';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Не удалось ${isEditMode ? 'обновить' : 'создать'} статью` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      // Вызываем onArticleCreated (переименованный в onFormSubmitSuccess в родителе)
      if (onArticleCreated) { 
        onArticleCreated();
      }
      // Если не в режиме редактирования, сбрасываем основные поля
      // Если в режиме редактирования, то форма обычно закрывается или сбрасывается через onCancelEdit
      if (!isEditMode) {
        setName('');
        setArticleType('expense');
        setParentId('');
        setIsArchived(false);
      }
      // Обновляем список родителей в любом случае
      fetchParentArticles(); 

    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          {isEditMode ? `Редактировать: ${articleToEdit?.name}` : 'Добавить новую статью ДДС'}
        </h2>
        {isEditMode && (
          <button 
            type="button" 
            onClick={onCancelEdit} 
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Отмена
          </button>
        )}
      </div>

      {submitError && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{submitError}</p>}
      {fetchParentsError && <p className="text-orange-600 bg-orange-100 p-3 rounded-md mb-4">Не удалось загрузить список родительских статей: {fetchParentsError}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Название статьи
          </label>
          <input
            type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="articleType" className="block text-sm font-medium text-gray-700 mb-1">Тип статьи</label>
          <select id="articleType" value={articleType} onChange={(e) => setArticleType(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
          Родительский раздел/статья
        </label>
        <select id="parentId" value={parentId} onChange={(e) => setParentId(e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">-- Без родителя --</option>
          {availableParents.map(parent => (
            <option key={parent.id} value={parent.id} disabled={isEditMode && parent.id === articleToEdit.id}>
              {parent.displayName}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-6">
        <label htmlFor="isArchived" className="flex items-center">
          <input
            type="checkbox" id="isArchived" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">В архиве</span>
        </label>
      </div>
      
      <div>
        <button
          type="submit" disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {isLoading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать статью')}
        </button>
      </div>
    </form>
  );
}

export default ArticleForm;