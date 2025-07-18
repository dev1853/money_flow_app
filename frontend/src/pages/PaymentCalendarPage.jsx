// frontend/src/pages/PaymentCalendarPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import PageTitle from '../components/PageTitle';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DatePicker from 'react-datepicker';
import PlannedPaymentForm from '../components/forms/PlannedPaymentForm';
import { getFirstDayOfMonth, getLastDayOfMonth, toISODateString } from '../utils/dateUtils';
import { formatCurrency, formatDate } from '../utils/formatting';
import { PlusIcon, PencilIcon, TrashIcon, TableCellsIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import PaymentCalendarView from '../components/PaymentCalendarView';
import PaymentCalendarTable from '../components/PaymentCalendarTable';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ActionIconButtons from '../components/forms/ActionIconButtons';

// Компонент PlannedPaymentItem остается без изменений, но с адаптированными стилями
const PlannedPaymentItem = ({ payment, onEdit, onDelete }) => (
    <div className={`group flex justify-between items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors`}>
        <div>
            <p className="text-sm text-gray-800 dark:text-gray-200">{payment.description}</p>
            {payment.is_recurring && <p className="text-xs text-gray-500 dark:text-gray-400">Регулярный</p>}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
            <span className={`text-sm font-semibold ${payment.payment_type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {payment.payment_type === 'EXPENSE' ? '-' : '+'} {formatCurrency(payment.amount)}
            </span>
            <ActionIconButtons
                onEdit={() => onEdit(payment)}
                onDelete={() => onDelete(payment.id)}
                editTitle="Редактировать платеж"
                deleteTitle="Удалить платеж"
                editAriaLabel="Редактировать платеж"
                deleteAriaLabel="Удалить платеж"
                size="sm"
            />
        </div>
    </div>
);


function PaymentCalendarPage() {
    const { activeWorkspace } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('calendar');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [paymentIdToDelete, setPaymentIdToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    // --- ✔️ ИСПРАВЛЕННАЯ ЛОГИКА ЗАГРУЗКИ ДАННЫХ ---
    const fetchDataForMonth = useCallback(async (date, startBalanceOverride = null) => {
        setIsLoading(true);
        setError(null);
        try {
            const startDate = getFirstDayOfMonth(date);
            const endDate = getLastDayOfMonth(date);
            const params = { 
                workspace_id: activeWorkspace?.id,
                start_date: toISODateString(startDate), 
                end_date: toISODateString(endDate),
                ...(startBalanceOverride !== null && { start_balance: startBalanceOverride })
            };
            const data = await apiService.getPaymentCalendar(params);
            setCalendarData(data);
        } catch (err) {
            setError(err.message || 'Не удалось загрузить данные календаря.');
        } finally {
            setIsLoading(false);
        }
    }, [activeWorkspace]);

    // Первичная загрузка данных - запускается только один раз при монтировании
    useEffect(() => {
        fetchDataForMonth(currentMonth);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const goToPreviousMonth = () => {
        const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        setCurrentMonth(prevMonth);
        fetchDataForMonth(prevMonth);
    };

    const goToNextMonth = () => {
        const endBalance = calendarData?.end_balance;
        if (endBalance !== null && endBalance !== undefined) {
            const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            setCurrentMonth(nextMonth);
            fetchDataForMonth(nextMonth, endBalance);
        }
    };
    
    const handleMonthChange = (date) => {
        setCurrentMonth(date);
        fetchDataForMonth(date);
    };

    const handleDataMutation = () => {
        if (calendarData) {
            fetchDataForMonth(currentMonth, calendarData.start_balance);
        }
    };

    const handleDayClick = (date) => {
      setSelectedDate(date);
      setEditingPayment(null);
      setShowForm(false);
      setIsModalOpen(true);
    };

    const handleEditClick = (payment) => {
        setEditingPayment(payment);
        setShowForm(true);
    };

    const handleDelete = (paymentId) => {
        setPaymentIdToDelete(paymentId);
        setIsConfirmModalOpen(true);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (!paymentIdToDelete) return;
        try {
            setDeleteError(null);
            await apiService.deletePlannedPayment(paymentIdToDelete, { workspace_id: activeWorkspace?.id });
            setIsConfirmModalOpen(false);
            setPaymentIdToDelete(null);
            handleDataMutation();
        } catch (err) {
            setDeleteError(err.message || 'Не удалось удалить запланированный платеж.');
        }
    };

    const handleCancelDelete = () => {
        setIsConfirmModalOpen(false);
        setPaymentIdToDelete(null);
        setDeleteError(null);
    };
    
    const handleSave = () => {
        setShowForm(false);
        setEditingPayment(null);
        handleDataMutation();
    };
    
    const paymentsForSelectedDay = useMemo(() => {
        if (!selectedDate || !calendarData) return [];
        const selectedDateString = toISODateString(new Date(selectedDate));
        return calendarData.calendar_days.find(d => d.date === selectedDateString)?.planned_payments || [];
    }, [selectedDate, calendarData]);


    return (
        <div className="dark:text-gray-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <PageTitle title="Платежный календарь" />
                <div className="flex items-center justify-end gap-2 sm:gap-4 flex-wrap">

                    <div className="flex items-center justify-center p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <Button variant="icon" size="sm" onClick={goToPreviousMonth} title="Предыдущий месяц">
                           <ChevronLeftIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <DatePicker
                            selected={currentMonth}
                            onChange={handleMonthChange}
                            dateFormat="LLLL yyyy"
                            showMonthYearPicker
                            locale="ru"
                            customInput={
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center w-36 capitalize cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                                    {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')}
                                </span>
                            }
                        />
                        <Button variant="icon" size="sm" onClick={goToNextMonth} title="Следующий месяц">
                           <ChevronRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                    
                    <div className="flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            title="Вид: Календарь"
                        >
                            <CalendarDaysIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            title="Вид: Таблица"
                        >
                            <TableCellsIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <Button
                        variant="primary"
                        onClick={() => {
                            setSelectedDate(toISODateString(new Date()));
                            setEditingPayment(null);
                            setShowForm(true);
                            setIsModalOpen(true);
                        }}
                        iconLeft={<PlusIcon className="h-5 w-5" />}
                    >
                        Запланировать
                    </Button>
                </div>
            </div>

            {isLoading && <Loader />}
            {error && <Alert type="error">{error}</Alert>}

            {calendarData && (
                <div>
                    {viewMode === 'calendar' ? (
                        <PaymentCalendarView 
                            calendarData={calendarData} 
                            currentDate={currentMonth} 
                            onDayClick={handleDayClick} 
                        />
                    ) : (
                        <PaymentCalendarTable 
                            calendarData={calendarData} 
                            onDayClick={handleDayClick} 
                        />
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Платежи на {selectedDate ? formatDate(new Date(selectedDate + 'T00:00:00')) : ''}</h2>
                        {!showForm && (
                            <Button onClick={() => { setEditingPayment(null); setShowForm(true); }} size="sm" iconLeft={<PlusIcon className="h-4 w-4" />}>
                                Добавить на эту дату
                            </Button>
                        )}
                    </div>

                    {showForm ? (
                        <PlannedPaymentForm 
                            payment={editingPayment}
                            onSave={handleSave} 
                            onCancel={() => { setShowForm(false); setEditingPayment(null); }} 
                            selectedDate={selectedDate}
                        />
                    ) : (
                        <div className="space-y-2">
                            {paymentsForSelectedDay.length > 0 ? (
                                paymentsForSelectedDay.map(p => (
                                    <PlannedPaymentItem 
                                        key={p.id} 
                                        payment={p} 
                                        onEdit={handleEditClick} 
                                        onDelete={handleDelete}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">На эту дату ничего не запланировано.</p>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Подтвердите удаление"
                message="Вы уверены, что хотите удалить этот запланированный платеж?"
                errorAlertMessage={deleteError}
            />
        </div>
    );
}

export default PaymentCalendarPage;