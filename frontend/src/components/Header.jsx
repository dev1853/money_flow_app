// src/components/Header.jsx
import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline'; // <--- Bars3Icon снова здесь
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react'; 
// QuickCashExpenseForm больше не нужен здесь, он в Sidebar


// Функция для объединения классов (утилита из Headless UI примеров)
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ИЗМЕНЕНО: Header снова принимает setSidebarOpen
const Header = ({ setSidebarOpen }) => { 
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      {/* Кнопка открытия сайдбара на мобильных (гамбургер) */}
      <button 
        type="button" 
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden" /* Виден только на lg:hidden (мобильные) */
        onClick={() => setSidebarOpen(true)} // <--- Использует setSidebarOpen
      >
        <span className="sr-only">Открыть сайдбар</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Мобильное название приложения - только для мобильных, с отступом от кнопки */}
      <span className="text-xl font-semibold leading-6 text-gray-900 lg:hidden ml-6">Money Flow</span>

      {/* Контент Header (отображается справа) */}
      <div className="flex-1 flex justify-end gap-x-4 sm:gap-x-6"> {/* flex-1 и justify-end для прижимания вправо */}
        {/* Кнопка уведомлений */}
        <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
          <span className="sr-only">Посмотреть уведомления</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Разделитель */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" aria-hidden="true" />

        {/* Профиль дропдаун */}
        {isAuthenticated ? (
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Открыть меню пользователя</span>
              <img
                className="h-8 w-8 rounded-full bg-gray-50"
                src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random&color=fff&bold=true`}
                alt=""
              />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user?.username}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-700 w-full text-left'
                      )}
                    >
                      Мой профиль
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-700 w-full text-left'
                      )}
                    >
                      Выйти
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <Link
            to="/login"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Войти
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;