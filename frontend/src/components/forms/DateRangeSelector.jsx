// frontend/src/components/forms/DateRangeSelector.jsx

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { getFirstDayOfMonth, getLastDayOfMonth, getCurrentQuarterDates } from '../../utils/dateUtils';

// Список наших пресетов
const datePresets = [
    {
        label: 'Этот месяц',
        getDates: () => ({
            startDate: getFirstDayOfMonth(new Date()),
            endDate: getLastDayOfMonth(new Date()),
        }),
    },
    {
        label: 'Прошлый месяц',
        getDates: () => {
            const now = new Date();
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return {
                startDate: getFirstDayOfMonth(prevMonth),
                endDate: getLastDayOfMonth(prevMonth),
            };
        },
    },
    {
        label: 'Этот квартал',
        getDates: () => getCurrentQuarterDates(),
    },
    {
        label: 'Следующие 30 дней',
        getDates: () => {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 30);
            return { startDate, endDate };
        },
    },
    {
        label: 'Следующие 90 дней',
        getDates: () => {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 90);
            return { startDate, endDate };
        },
    },
];

const DateRangeSelector = ({ onDatesChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('Этот месяц');
    const wrapperRef = useRef(null);

    // Закрываем меню при клике вне его
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);


    const handleSelect = (preset) => {
        setSelectedLabel(preset.label);
        onDatesChange(preset.getDates());
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={wrapperRef}>
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedLabel}
                    <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {datePresets.map((preset) => (
                            <a
                                key={preset.label}
                                href="#"
                                className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
                                role="menuitem"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSelect(preset);
                                }}
                            >
                                {preset.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeSelector;