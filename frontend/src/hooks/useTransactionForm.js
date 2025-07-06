// frontend/src/hooks/useTransactionForm.js

import React from 'react';

// Вспомогательную функцию можно оставить здесь же или вынести в отдельный файл утилит
const flattenArticles = (articles, level = 0) => {
    let options = [];
    articles.forEach(article => {
        const label = `${'—'.repeat(level)} ${article.name}`;
        if (article.article_type !== 'group') {
            options.push({
                value: article.id,
                label: label,
                type: article.article_type,
            });
        }
        if (article.children && article.children.length > 0) {
            options = options.concat(flattenArticles(article.children, level + 1));
        }
    });
    return options;
};

export const useTransactionForm = ({ transaction, articles, defaultType, onSubmit }) => {
    const [formData, setFormData] = React.useState({
        transaction_type: 'EXPENSE', 
        article_id: '', 
        account_id: '', 
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
    });

    React.useEffect(() => {
        if (transaction) {
            setFormData({
                transaction_type: transaction.transaction_type,
                account_id: transaction.from_account_id || transaction.to_account_id || '', 
                article_id: transaction.dds_article_id || '', 
                amount: transaction.amount,
                description: transaction.description || '',
                transaction_date: transaction.transaction_date.split('T')[0],
            });
           } else {
            setFormData({
                transaction_type: defaultType || 'EXPENSE', 
                article_id: '',
                account_id: '',
                amount: '',
                description: '',
                transaction_date: new Date().toISOString().split('T')[0],
            });
        }
    }, [transaction, defaultType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTransactionTypeChange = (newValue) => {
        setFormData(prev => ({
            ...prev,
            transaction_type: newValue,
            article_id: '', 
            account_id: '', 
        }));
    };

    const articleOptions = React.useMemo(() => {
        if (!articles || articles.length === 0) return [];
        const flattened = flattenArticles(articles);
        return flattened.filter(a => {
            // Здесь мы используем formData.transaction_type напрямую,
            // предполагая, что article_type в articles тоже в нижнем регистре.
            // Если article_type в верхнем, то нужно привести к верхнему здесь.
            if (formData.transaction_type === 'INCOME') {
                return a.type === 'income'; 
            }
            if (formData.transaction_type === 'EXPENSE') {
                return a.type === 'expense'; 
            }
            return a.type !== 'group';
        });
    }, [articles, formData.transaction_type]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        console.log("useTransactionForm: formData.account_id перед преобразованием ->", formData.account_id);
        console.log("useTransactionForm: formData.transaction_type перед преобразованием ->", formData.transaction_type);

        // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Преобразуем transaction_type в верхний регистр заранее! ***
        const transactionTypeUpper = formData.transaction_type.toUpperCase();

        const dataToSend = {
            transaction_type: transactionTypeUpper, // Используем преобразованное значение
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            transaction_date: formData.transaction_date,
            dds_article_id: formData.article_id ? parseInt(formData.article_id, 10) : null,
        };

        // Теперь сравнение будет корректным, так как transactionTypeUpper в верхнем регистре
        if (transactionTypeUpper === 'EXPENSE') { 
            dataToSend.from_account_id = formData.account_id ? parseInt(formData.account_id, 10) : null;
            dataToSend.to_account_id = null; 
        } else if (transactionTypeUpper === 'INCOME') { 
            dataToSend.to_account_id = formData.account_id ? parseInt(formData.account_id, 10) : null;
            dataToSend.from_account_id = null; 
        } else if (transactionTypeUpper === 'TRANSFER') {
            console.warn("Для типа 'TRANSFER' в форме 'TransactionForm' требуется два поля счета (источник и получатель). Текущая реализация может быть некорректной.");
            dataToSend.from_account_id = formData.account_id ? parseInt(formData.account_id, 10) : null; 
            dataToSend.to_account_id = null; 
        }
        
        console.log("useTransactionForm: dataToSend после преобразования ->", dataToSend);

        onSubmit(dataToSend);
    };

    return {
        formData,
        handleInputChange,
        handleTransactionTypeChange,
        handleSubmit,
        articleOptions
    };
};