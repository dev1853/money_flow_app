import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  NewspaperIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon, 
  ChevronRightIcon,
  ReceiptPercentIcon,
  PowerIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  BookOpenIcon, // Новая иконка для Справочников
  BriefcaseIcon, // Новая иконка для Операций
  ScaleIcon, // Новая иконка для Планирования
} from '@heroicons/react/24/outline';
import ExpenseQuickInputMLContainer from './forms/ExpenseQuickInputMLContainer';
import Modal from './Modal';
import Button from './Button';


// ==================================================================
// НОВАЯ СТРУКТУРА НАВИГАЦИИ
// ==================================================================
const navigation = [
  { name: 'Сводка', href: '/dashboard', icon: HomeIcon, type: 'link' },
  {
    name: 'Операции',
    icon: BriefcaseIcon,
    type: 'parent',
    children: [
      { name: 'Все операции', href: '/transactions' },
      { name: 'Платежный календарь', href: '/payment-calendar' },
    ],
  },
  {
    name: 'Планирование и Аналитика',
    icon: ScaleIcon,
    type: 'parent',
    children: [
      { name: 'Бюджеты', href: '/budgets' },
      { name: 'Отчет ДДС', href: '/reports/dds' },
      { name: 'Отчет ПиУ', href: '/reports/pnl' },
    ],
  },
  {
    name: 'Справочники',
    icon: BookOpenIcon,
    type: 'parent',
    children: [
      { name: 'Счета', href: '/accounts' },
      { name: 'Статьи', href: '/articles' },
      { name: 'Контрагенты', href: '/counterparties' },
      { name: 'Договоры', href: '/contracts' },
    ],
  },
  {
    name: 'Настройки',
    icon: Cog6ToothIcon,
    type: 'parent',
    children: [
      // { name: 'Правила разнесения', href: '/mapping-rules' },
      { name: 'Помощь', href: '/help' },
    ],
  },
];


function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ setSidebarOpen }) { 
  const location = useLocation();
  const [openStates, setOpenStates] = useState(new Map());
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const isParentActive = useCallback((item) => {
    if (!item.children) return false;
    return item.children.some(child => location.pathname.startsWith(child.href));
  }, [location.pathname]);

  useEffect(() => {
    const initialOpenStates = new Map();
    navigation.forEach(item => {
      if (item.type === 'parent') {
        initialOpenStates.set(item.name, isParentActive(item));
      }
    });
    setOpenStates(initialOpenStates);
  }, [location.pathname, isParentActive]);

  const toggleParentMenu = useCallback((itemName) => {
    setOpenStates(prev => {
      const newStates = new Map(prev);
      newStates.set(itemName, !newStates.get(itemName));
      return newStates;
    });
  }, []); 

  const baseNavLinkClasses = "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6";

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center group">
          <PowerIcon 
            className="h-8 w-8 text-indigo-600 group-hover:text-indigo-500 transition-colors" 
            aria-hidden="true" 
          />
          <span className="ml-3 text-2xl font-extrabold text-gray-900 dark:text-gray-100">ПОТОК ДЕНЕГ</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.type === 'parent' ? (
                    <>
                      <div
                        onClick={() => toggleParentMenu(item.name)} 
                        className={classNames(
                          isParentActive(item)
                            ? 'bg-gray-100 dark:bg-gray-700 text-indigo-500' 
                            : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700',
                          baseNavLinkClasses, 
                          'cursor-pointer'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            isParentActive(item)
                              ? 'text-indigo-500'
                              : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                        <ChevronRightIcon 
                          className={classNames(
                            'ml-auto h-5 w-5 shrink-0 transition-transform duration-200',
                            openStates.get(item.name) ? 'rotate-90' : '' 
                          )} 
                          aria-hidden="true" 
                        />
                      </div>
                      <ul 
                        className={classNames(
                          'ml-4 pl-4 border-l border-gray-200 dark:border-gray-600 mt-1 space-y-1 overflow-hidden transition-all duration-300',
                          openStates.get(item.name) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0' 
                        )}
                      >
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <NavLink
                              to={child.href}
                              {...(child.href === '/payment-calendar' ? { 'data-tour': 'calendar' } : {})}
                              {...(child.href === '/reports/dds' ? { 'data-tour': 'dds-report' } : {})}
                              {...(child.href === '/counterparties' ? { 'data-tour': 'counterparties' } : {})}
                              onClick={() => setSidebarOpen && setSidebarOpen(false)} 
                              className={({ isActive }) => classNames( 
                                isActive
                                  ? 'bg-gray-100 dark:bg-gray-700 text-indigo-500'
                                  : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                              )}
                            >
                              {child.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : ( 
                    <NavLink
                      to={item.href}
                      onClick={() => setSidebarOpen && setSidebarOpen(false)} 
                      className={({ isActive }) => classNames( 
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-700 text-indigo-500'
                          : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700',
                        baseNavLinkClasses 
                      )}
                    >
                      <item.icon
                        className={classNames(
                          location.pathname === item.href 
                            ? 'text-indigo-500' 
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>

      <div className="flex flex-col gap-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
        <Button
          variant="primary"
          fullWidth
          onClick={() => setShowExpenseModal(true)}
        >
          Добавить расход (ИИ)
        </Button>
        <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Добавить расход (ИИ)">
          <ExpenseQuickInputMLContainer onSave={() => setShowExpenseModal(false)} />
        </Modal>
      </div>
    </div>
  );
}