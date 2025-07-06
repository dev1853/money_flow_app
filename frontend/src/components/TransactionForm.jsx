// frontend/src/components/TransactionForm.jsx
import React from 'react';

import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';
// Импортируем наш хук с логикой
import { useTransactionForm } from '../hooks/useTransactionForm';

// Импортируем ваши кастомные компоненты форм
import Input from './forms/Input';
import Select from './forms/Select';
import Textarea from './forms/Textarea';
import Label from './forms/Label';
import Button from './Button'; 
import SegmentedControl from './forms/SegmentedControl'

const transactionTypeOptions = [
    {
        value: 'EXPENSE',
        label: 'Расход',
        icon: <ArrowDownCircleIcon />,
        activeClassName: 'bg-red-100 text-red-800 shadow-sm'
    },
    {
        value: 'INCOME',
        label: 'Доход',
        icon: <ArrowUpCircleIcon />,
        activeClassName: 'bg-green-100 text-green-800 shadow-sm'
    },
];
const TransactionForm = (props) => {
    // Получаем всю логику и данные из кастомного хука
    const {
        formData,
        handleInputChange,
        handleTransactionTypeChange,
        handleSubmit,
        articleOptions
    } = useTransactionForm(props);

    // Получаем остальные пропсы для отображения
    const { onCancel, accounts, isSubmitting, error } = props;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="transaction_type">Тип</Label>
                <SegmentedControl
                    name="transaction_type"
                    options={transactionTypeOptions}
                    value={formData.transaction_type.toUpperCase()} 
                    onChange={handleTransactionTypeChange} // Передаем новый обработчик
                />
                    {transactionTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
            </div>

            <div>
                <Label htmlFor="transaction_date">Дата</Label>
                <Input
                    type="date"
                    id="transaction_date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                />
            </div>

            <div>
                <Label htmlFor="account_id">Счет</Label>
                <Select
                    id="account_id"
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleInputChange}
                >
                    <option value="">Выберите счет</option>
                    {accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                </Select>
            </div>

            <div>
                <Label htmlFor="article_id">Статья</Label>
                <Select
                    id="article_id"
                    name="article_id"
                    value={formData.article_id}
                    onChange={handleInputChange}
                >
                    <option value="">Выберите статью</option>
                    {articleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </div>

            <div>
                <Label htmlFor="amount">Сумма</Label>
                <Input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                />
            </div>

            <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="secondary" // Предполагаю, что у вас есть такой вариант стиля
                >
                    Отмена
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>
        </form>
    );
};

export default TransactionForm;