// frontend/src/pages/PaymentCalendarPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/apiService';
import PageTitle from '../components/PageTitle';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PlannedPaymentForm from '../components/forms/PlannedPaymentForm';
import { getFirstDayOfMonth, getLastDayOfMonth, toISODateString } from '../utils/dateUtils';
import { formatCurrency, formatDate } from '../utils/formatting';
import { PlusIcon, PencilIcon, TrashIcon, TableCellsIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PaymentCalendarView from '../components/PaymentCalendarView';
import PaymentCalendarTable from '../components/PaymentCalendarTable';

// Компонент для отображения одного платежа в модальном окне
const PlannedPaymentItem = ({ payment, onEdit, onDelete }) => (
    <div className={`group flex justify-between items-center p-2 rounded hover:bg-gray-100 transition-colors`}>
        <div>
            <p className="text-sm text-gray-800">{payment.description}</p>
            {payment.is_recurring && <p className="text-xs text-gray-500">Регулярный ({payment.recurrence_rule})</p>}
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${payment.payment_type === 'INCOME' ? 'text-green-700' : 'text-red-700'}`}>
                {payment.payment_type === 'EXPENSE' ? '-' : '+'} {formatCurrency(payment.amount)}
            </span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" iconLeft={<PencilIcon className="h-4 w-4" />} onClick={() => onEdit(payment)} />
                <Button size="sm" variant="danger" iconLeft={<TrashIcon className="h-4 w-4" />} onClick={() => onDelete(payment.id)} />
            </div>
        </div>
    </div>
);


function PaymentCalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('calendar');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    useEffect(() => {
        const refetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const startDate = getFirstDayOfMonth(currentMonth);
                const endDate = getLastDayOfMonth(currentMonth);
                const params = { start_date: toISODateString(startDate), end_date: toISODateString(endDate) };
                const data = await apiService.getPaymentCalendar(params);
                setCalendarData(data);
            } catch (err) {
                setError(err.message || 'Не удалось загрузить данные календаря.');
            } finally {
                setIsLoading(false);
            }
        };
        refetchData();
    }, [currentMonth]);

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

    const handleDelete = async (paymentId) => {
        if (window.confirm('Вы уверены?')) {
            try {
                await apiService.deletePlannedPayment(paymentId);
                // Просто перезагружаем данные для текущего месяца
                const startDate = getFirstDayOfMonth(currentMonth);
                const endDate = getLastDayOfMonth(currentMonth);
                const params = { start_date: toISODateString(startDate), end_date: toISODateString(endDate) };
                const data = await apiService.getPaymentCalendar(params);
                setCalendarData(data);
            } catch (err) {
                alert('Не удалось удалить платеж: ' + err.message);
            }
        }
    };

    const handleSave = () => {
        setShowForm(false);
        setEditingPayment(null);
        const startDate = getFirstDayOfMonth(currentMonth);
        const endDate = getLastDayOfMonth(currentMonth);
        const params = { start_date: toISODateString(startDate), end_date: toISODateString(endDate) };
        apiService.getPaymentCalendar(params).then(setCalendarData);
    };
    
    const paymentsForSelectedDay = useMemo(() => {
        if (!selectedDate || !calendarData) return [];
        const selectedDateString = toISODateString(new Date(selectedDate));
        return calendarData.calendar_days.find(d => d.date === selectedDateString)?.planned_payments || [];
    }, [selectedDate, calendarData]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <PageTitle title="Платежный календарь" />
                 <div className="flex items-center gap-4">
                    {/* --- ВОТ ПРАВИЛЬНЫЙ БЛОК НАВИГАЦИИ --- */}
                    <div className="flex items-center gap-2 border border-gray-300 rounded-md p-1">
                        <Button onClick={goToPreviousMonth} variant="ghost" size="sm" iconLeft={<ChevronLeftIcon className="h-5 w-5" />} />
                        <span className="text-sm font-semibold text-gray-700 text-center w-36">
                            {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')}
                        </span>
                        <Button onClick={goToNextMonth} variant="ghost" size="sm" iconLeft={<ChevronRightIcon className="h-5 w-5" />} />
                    </div>
                    
                    <div className="flex items-center rounded-md bg-gray-200 p-1">
                        <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-300'}`} title="Вид: Календарь">
                            <CalendarDaysIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-300'}`} title="Вид: Таблица">
                            <TableCellsIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <Button onClick={() => { setSelectedDate(toISODateString(new Date())); setEditingPayment(null); setShowForm(true); setIsModalOpen(true); }} iconLeft={<PlusIcon className="h-5 w-5" />}>
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
                        <h2 className="text-lg font-bold">Платежи на {selectedDate ? formatDate(new Date(selectedDate + 'T00:00:00')) : ''}</h2>
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
                                <p className="text-sm text-gray-500 text-center py-4">На эту дату ничего не запланировано.</p>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default PaymentCalendarPage;