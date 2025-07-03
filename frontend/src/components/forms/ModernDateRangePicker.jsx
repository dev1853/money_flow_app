import React, { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '../Button';

// Вспомогательная функция для объединения классов Tailwind
function cn(...inputs) { return twMerge(clsx(inputs)); }


// Кастомная шапка, стилизованная под ваш дизайн
function CustomHeader(props) {
    const { fromMonth, goToMonth } = props;
    const fromDate = fromMonth || new Date();
    const prevMonth = addDays(fromDate, -15);
    const nextMonth = addDays(fromDate, 15);
    return (
        <div className="flex items-center justify-between pt-2 pb-4">
            <button type="button" className="p-1 rounded-full hover:bg-gray-100" onClick={() => goToMonth(prevMonth)}>
                <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <div className="text-sm font-semibold text-gray-800">
                {format(fromDate, 'LLLL yyyy', { locale: ru })}
            </div>
            <button type="button" className="p-1 rounded-full hover:bg-gray-100" onClick={() => goToMonth(nextMonth)}>
                <ChevronRightIcon className="h-5 w-5 text-gray-700" />
            </button>
        </div>
    );
}

// Основной компонент
export default function ModernDateRangePicker({ className, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalRange, setInternalRange] = useState(value);

  // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
  // Синхронизируем состояние от родителя ТОЛЬКО если календарь закрыт.
  // Это защищает выбор пользователя от внешних перерисовок.
  useEffect(() => {
    if (!isOpen) {
      setInternalRange(value);
    }
  }, [value, isOpen]);

  const handleSelect = (range) => {
    setInternalRange(range);

    const isRangeComplete = range?.from && range?.to;
    if (isRangeComplete && onChange) {
      onChange(range);
      setIsOpen(false); // Закрываем календарь, когда диапазон выбран
    }
  };

  const handlePreset = (preset) => {
    const now = new Date();
    let from, to;
    switch (preset) {
        case 'today': from = now; to = now; break;
        case 'last7': from = addDays(now, -6); to = now; break;
        case 'thisWeek': from = startOfWeek(now, { locale: ru }); to = endOfWeek(now, { locale: ru }); break;
        case 'thisMonth': from = startOfMonth(now); to = endOfMonth(now); break;
        case 'lastMonth': const pM = subMonths(now, 1); from = startOfMonth(pM); to = endOfMonth(pM); break;
        default: break;
    }
    setInternalRange({ from, to }); // Сначала обновляем внутреннее состояние
    if (onChange) {
      onChange({ from, to }); // Затем сообщаем родителю
    }
    setIsOpen(false); 
  };
  
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Кнопка-триггер, которая открывает календарь */}
      <Popover.Trigger asChild>
        <button
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
        <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-600" />
            <span>
              {internalRange?.from ? (
                internalRange.to ? (
                  <>{format(internalRange.from, 'dd.MM.yy')} - {format(internalRange.to, 'dd.MM.yy')}</>
                ) : (
                  format(internalRange.from, 'dd.MM.yy')
                )
              ) : ( 'Выберите диапазон' )}
            </span>
        </div>
        </button>
      </Popover.Trigger>
      
      {/* Содержимое всплывающего окна */}
      <Popover.Content
        align="start"
        className="flex w-auto rounded-lg border bg-white p-4 shadow-md z-30"
      >
        {/* Панель с пресетами */}
        <div className="flex flex-col space-y-2 pr-4 border-r mr-4">
          <Button variant="ghost" onClick={() => handlePreset('today')}>Сегодня</Button>
          <Button variant="ghost" onClick={() => handlePreset('last7')}>Последние 7 дней</Button>
          <Button variant="ghost" onClick={() => handlePreset('thisWeek')}>Эта неделя</Button>
          <Button variant="ghost" onClick={() => handlePreset('thisMonth')}>Этот месяц</Button>
          <Button variant="ghost" onClick={() => handlePreset('lastMonth')}>Прошлый месяц</Button>
        </div>
        
        {/* Сам календарь */}
        <DayPicker
          mode="range"
          locale={ru}
          selected={internalRange}
          onSelect={handleSelect}
          numberOfMonths={1}
          components={{ Caption: CustomHeader }}
          // --- ФИНАЛЬНЫЕ ИСПРАВЛЕНИЯ СТИЛЕЙ ЗДЕСЬ ---
          classNames={{
            months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            head_row: 'flex justify-center', // Центрируем дни недели
            head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
            row: 'flex w-full mt-2',
            
            // 1. ИСПРАВЛЕНИЕ ЦЕНТРИРОВАНИЯ: Делаем ячейку flex-контейнером
            cell: cn(
              'h-9 w-9 p-0 text-center text-sm relative focus-within:relative focus-within:z-20',
              'flex items-center justify-center' // <--- Гарантирует идеальное центрирование
            ),
            
            day: cn(
              'h-9 w-9 p-0 font-normal rounded-full transition-colors',
              'hover:bg-gray-100', // Стандартный ховер для пустых дней
              'aria-selected:opacity-100'
            ),
            
            // 2. ИСПРАВЛЕНИЕ ПОДСВЕТКИ ДИАПАЗОНА:
            // Этот стиль применяется к любому дню в выбранном или "наводимом" диапазоне
            day_inside_range: 'rounded-none bg-indigo-100 hover:bg-indigo-100',
            
            day_selected:
              'bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white',
            day_today: 'bg-gray-200 text-gray-900 font-bold',
            day_outside: 'text-gray-400 opacity-50',
            day_disabled: 'text-gray-400 opacity-50',
            day_range_start: 'day-range-start rounded-r-none', // Добавляем классы для кастомизации
            day_range_end: 'day-range-end rounded-l-none',
            day_hidden: 'invisible',
          }}
          // --- КОНЕЦ ИСПРАВЛЕНИЯ СТИЛЕЙ ---
        />
      </Popover.Content>
    </Popover.Root>
  );
}