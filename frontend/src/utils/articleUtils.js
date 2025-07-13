// frontend/src/utils/articleUtils.js

export const flattenDdsArticles = (articles) => {
    let flatList = [];
    articles.forEach(article => {
        // Добавляем только статьи, которые не являются группами
        if (article.article_type !== 'group') {
            flatList.push(article);
        }
        // Рекурсивно добавляем дочерние элементы
        if (article.children && article.children.length > 0) {
            flatList = flatList.concat(flattenDdsArticles(article.children));
        }
    });
    return flatList;
};