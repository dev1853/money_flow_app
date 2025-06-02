// frontend/src/components/ArticleForm.jsx
import { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Alert from './Alert';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../contexts/AuthContext'; // <--- ДОБАВЛЕН ИМПОРТ useAuth

function ArticleForm({ onArticleCreated, articleToEdit, onCancelEdit }) { //
  const [name, setName] = useState(''); //
  const [articleType, setArticleType] = useState('expense'); //
  const [parentId, setParentId] = useState(''); //
  const [isArchived, setIsArchived] = useState(false); //

  const [availableParents, setAvailableParents] = useState([]); //
  const [fetchParentsError, setFetchParentsError] = useState(null); //

  const [submitError, setSubmitError] = useState(null); //
  const [isLoading, setIsLoading] = useState(false); //

  const isEditMode = Boolean(articleToEdit); //
  const { token } = useAuth(); // <--- ПОЛУЧАЕМ ТОКЕН

  useEffect(() => { //
    if (isEditMode && articleToEdit) {
      setName(articleToEdit.name); //
      setArticleType(articleToEdit.article_type); //
      setParentId(articleToEdit.parent_id === null ? '' : String(articleToEdit.parent_id)); //
      setIsArchived(articleToEdit.is_archived); //
    } else {
      setName(''); //
      setArticleType('expense'); //
      setParentId(''); //
      setIsArchived(false); //
    }
  }, [articleToEdit, isEditMode]); //


  const fetchParentArticles = useCallback(async () => { //
    if (!token) { // <--- ПРОВЕРКА ТОКЕНА
        setFetchParentsError("Для загрузки статей требуется авторизация.");
        return;
    }
    try {
      setFetchParentsError(null); //
      const headers = { 'Authorization': `Bearer ${token}` }; // <--- ДОБАВЛЕНЫ HEADERS С ТОКЕНОМ
      const response = await fetch(`${API_BASE_URL}/articles/`, { headers }); //
      if (!response.ok) { //
        throw new Error(`Ошибка загрузки родительских статей: ${response.status}`); //
      }
      const data = await response.json(); //
      const flattenArticles = (articles, level = 0, currentArticleId = null) => { //
        let flatList = [];
        articles.forEach(article => {
          if (currentArticleId === article.id) return; //

          flatList.push({ //
            ...article,
            displayName: `${'—'.repeat(level)} ${article.name}`
          });
          if (article.children && article.children.length > 0) { //
            flatList = flatList.concat(flattenArticles(article.children, level + 1, currentArticleId)); //
          }
        });
        return flatList;
      };
      setAvailableParents(flattenArticles(data, 0, articleToEdit ? articleToEdit.id : null)); //
    } catch (err) { //
      setFetchParentsError(err.message); //
      console.error("Ошибка при загрузке родительских статей:", err); //
    }
  }, [articleToEdit, token]); // <--- ДОБАВЛЕН token В ЗАВИСИМОСТИ

  useEffect(() => { //
    fetchParentArticles(); //
  }, [fetchParentArticles]); //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    if (!token) { // <--- ПРОВЕРКА ТОКЕНА
      setSubmitError("Ошибка авторизации: токен не найден.");
      return;
    }
    setIsLoading(true); //
    setSubmitError(null); //

    const payload = { //
      name: name,
      article_type: articleType,
      is_archived: isArchived,
      parent_id: parentId ? parseInt(parentId, 10) : null,
    };

    const url = isEditMode
      ? `${API_BASE_URL}/articles/${articleToEdit.id}` //
      : `${API_BASE_URL}/articles/`; //
    const method = isEditMode ? 'PUT' : 'POST'; //

    try {
      const headers = { // <--- ДОБАВЛЕНЫ HEADERS С ТОКЕНОМ
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const response = await fetch(url, { //
        method: method,
        headers: headers, // <--- ПЕРЕДАЕМ HEADERS
        body: JSON.stringify(payload),
      });

      if (!response.ok) { //
        const errorData = await response.json().catch(() => ({ detail: `Не удалось ${isEditMode ? 'обновить' : 'создать'} статью` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`); //
      }

      if (onArticleCreated) { //
        onArticleCreated();
      }
      if (!isEditMode) { //
        setName('');
        setArticleType('expense');
        setParentId('');
        setIsArchived(false);
      }
      fetchParentArticles(); //

    } catch (err) { //
      setSubmitError(err.message); //
    } finally {
      setIsLoading(false); //
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white shadow-lg rounded-lg"> {/* */}
      <div className="flex justify-between items-center mb-6"> {/* */}
        <h2 className="text-2xl font-semibold text-gray-700"> {/* */}
          {isEditMode ? `Редактировать: ${articleToEdit?.name}` : 'Добавить новую статью ДДС'}
        </h2>
        {isEditMode && onCancelEdit && (
          <Button variant="link" size="sm" onClick={onCancelEdit}> {/* */}
            Отмена
          </Button>
        )}
      </div>

      {submitError && <Alert type="error" message={submitError} className="mb-4" />} {/* */}
      {fetchParentsError && <Alert type="warning" title="Ошибка загрузки родительских статей" message={fetchParentsError} className="mb-4" />} {/* */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4"> {/* */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1"> {/* */}
            Название статьи
          </label>
          <input
            type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} //
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" //
            required
          />
        </div>
        <div>
          <label htmlFor="articleType" className="block text-sm font-medium text-gray-700 mb-1">Тип статьи</label> {/* */}
          <select id="articleType" value={articleType} onChange={(e) => setArticleType(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" //
          >
            <option value="expense">Расход</option> {/* */}
            <option value="income">Доход</option> {/* */}
          </select>
        </div>
      </div>

      <div className="mb-4"> {/* */}
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1"> {/* */}
          Родительский раздел/статья
        </label>
        <select id="parentId" value={parentId} onChange={(e) => setParentId(e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" //
        >
          <option value="">-- Без родителя --</option> {/* */}
          {availableParents.map(parent => ( //
            <option key={parent.id} value={parent.id} disabled={isEditMode && parent.id === articleToEdit.id}> {/* */}
              {parent.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6"> {/* */}
        <label htmlFor="isArchived" className="flex items-center"> {/* */}
          <input
            type="checkbox" id="isArchived" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} //
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" //
          />
          <span className="ml-2 text-sm text-gray-700">В архиве</span> {/* */}
        </label>
      </div>

      <div>
        <Button
          type="submit" //
          variant="primary" // Оригинальный цвет был bg-blue-600, primary (indigo) близок
          size="md"
          disabled={isLoading} //
          fullWidth
        >
          {isLoading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать статью')} {/* */}
        </Button>
      </div>
    </form>
  );
}

export default ArticleForm; //