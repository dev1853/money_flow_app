// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  HomeIcon,
  NewspaperIcon,
  CurrencyDollarIcon,
  ChartBarIcon, // <-- Используем эту иконку для бюджетов
  Cog6ToothIcon, 
  ChevronRightIcon, 
  ReceiptPercentIcon,
  CircleStackIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Menu, Transition } from '@headlessui/react'; 
import { useAuth } from '../contexts/AuthContext';

import QuickCashExpenseForm from './QuickCashExpenseForm';


const navigation = [
  { name: 'Дашборд', href: '/dashboard', icon: HomeIcon, type: 'link' },
  { name: 'Транзакции', href: '/transactions', icon: NewspaperIcon, type: 'link' },
  { name: 'Счета', href: '/accounts', icon: CurrencyDollarIcon, type: 'link' },
  { name: 'Статьи ДДС', href: '/articles', icon: ReceiptPercentIcon, type: 'link' },
  { name: 'Бюджеты', href: '/budgets', icon: ChartBarIcon, type: 'link' }, // <-- НОВОЕ: Добавляем пункт для Бюджетов

  {
    name: 'Отчеты',
    icon: ChartBarIcon,
    type: 'parent',
    children: [
      { name: 'Движение ДС', href: '/reports/dds' },
      { name: 'Прибыли и Убытки', href: '/reports/pnl' },
    ],
  },

  {
    name: 'Настройки',
    icon: Cog6ToothIcon,
    type: 'parent',
    children: [
      { name: 'Правила разнесения', href: '/mapping-rules' },
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

  // Вспомогательная функция для определения, активен ли родительский пункт
  const isParentActive = useCallback((item) => {
    if (!item.children) return false;
    // Проверяем, если URL текущей страницы начинается с href любого из дочерних элементов
    return item.children.some(child => location.pathname.startsWith(child.href));
  }, [location.pathname]);

  // Обновляем состояние раскрытия при первой загрузке или смене маршрута
  useEffect(() => {
    const initialOpenStates = new Map();
    navigation.forEach(item => {
      if (item.type === 'parent') {
        initialOpenStates.set(item.name, isParentActive(item));
      }
    });
    setOpenStates(initialOpenStates);
  }, [location.pathname, isParentActive]);

  // Универсальная функция для переключения состояния раскрытия родительских элементов
  const toggleParentMenu = useCallback((itemName) => {
    setOpenStates(prev => {
      const newStates = new Map(prev);
      newStates.set(itemName, !newStates.get(itemName));
      return newStates;
    });
  }, []); 

  const { isAuthenticated, user, logout } = useAuth();

  // Общие классы для ссылок навигации
  const baseNavLinkClasses = "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6";


  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center group">
          <CircleStackIcon 
            className="h-8 w-8 text-indigo-600 group-hover:text-indigo-500 transition-colors" 
            aria-hidden="true" 
          />
          <span className="ml-3 text-2xl font-extrabold text-gray-900">БизнесПоток</span>
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
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                          baseNavLinkClasses, 
                          'cursor-pointer'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            isParentActive(item)
                              ? 'text-indigo-600'
                              : 'text-gray-400 group-hover:text-indigo-600',
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
                          'ml-10 mt-1 space-y-1 overflow-hidden transition-all duration-300',
                          openStates.get(item.name) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0' 
                        )}
                      >
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <NavLink
                              to={child.href}
                              onClick={() => setSidebarOpen(false)} 
                              className={({ isActive }) => classNames( 
                                isActive
                                  ? 'bg-gray-50 text-indigo-600'
                                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
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
                      onClick={() => setSidebarOpen(false)} 
                      className={({ isActive }) => classNames( 
                        isActive
                          ? 'bg-gray-50 text-indigo-600'
                          : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                        baseNavLinkClasses 
                      )}
                    >
                      <item.icon
                        className={classNames(
                          location.pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
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

      <div className="flex flex-col gap-y-3 border-t border-gray-200 pt-4 mt-auto">
        <div className="flex items-center justify-between"> 
          <QuickCashExpenseForm />
        </div>
      </div>
    </div>
  );
}