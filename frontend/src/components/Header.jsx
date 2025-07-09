// src/components/Header.jsx
import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, Bars3Icon, PlusIcon, CircleStackIcon } from '@heroicons/react/24/outline'; // PlusIcon для "Добавить компанию"
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react'; 
import { useState, useEffect } from 'react'; // Добавлен useEffect для отладки
import Modal from './Modal';
import WorkspaceForm from './forms/WorkspaceForm';


function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Header принимает setSidebarOpen для кнопки-гамбургера
const Header = ({ setSidebarOpen }) => { 
  console.log("DEBUG(Header): Component Rendered."); // <--- ЛОГ РЕНДЕРА
  const { isAuthenticated, user, logout, setActiveWorkspace, activeWorkspace, workspaces, fetchWorkspaces } = useAuth(); // <--- Добавлены workspaces, fetchWorkspaces
  console.log('[Header] Полученные данные из AuthContext:', { activeWorkspace, workspaces });

  console.log("DEBUG(Header): setActiveWorkspace type:", typeof setActiveWorkspace); // <--- КРИТИЧЕСКИ ВАЖНЫЙ ЛОГ
  console.log("DEBUG(Header): activeWorkspace value:", activeWorkspace); // <--- ЛОГ
  console.log("DEBUG(Header): workspaces value:", workspaces); // <--- ЛОГ

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  // useEffect для отладки, если activeWorkspace меняется
  useEffect(() => {
    console.log("DEBUG(Header): useEffect mounted/updated. activeWorkspace:", activeWorkspace); // <--- ЛОГ
  }, [activeWorkspace]);

  const handleNewWorkspaceSuccess = async (newWorkspace) => { // Сделал async, чтобы можно было await
    console.log("DEBUG(Header): handleNewWorkspaceSuccess called. newWorkspace:", newWorkspace); // <--- ЛОГ
    setShowWorkspaceModal(false);
    if (newWorkspace) {
      console.log("DEBUG(Header): Setting active workspace to new one:", newWorkspace); // <--- ЛОГ
      // setActiveWorkspace(newWorkspace); // <--- ИСПОЛЬЗУЕТСЯ ЗДЕСЬ
      // ВМЕСТО setActiveWorkspace(newWorkspace) и window.location.reload();
      // Вызываем fetchWorkspaces, чтобы обновить список и activeWorkspace в AuthContext
      await fetchWorkspaces(); // <--- ОБНОВЛЯЕМ WORKSPACES В КОНТЕКСТЕ
      window.location.reload(); // <--- Если все еще нужен reload для других компонентов
    }
  };
  
const handleWorkspaceChange = (workspaceId) => {
  console.log(`[Header] Попытка сменить воркспейс на ID: ${workspaceId}`); // <-- ЛОГ 1

  const newActiveWorkspace = workspaces.find(ws => ws.id === Number(workspaceId));
  
  if (newActiveWorkspace) {
    console.log('[Header] Найден новый воркспейс:', newActiveWorkspace); // <-- ЛОГ 2
    setActiveWorkspace(newActiveWorkspace);
    localStorage.setItem('activeWorkspaceId', newActiveWorkspace.id);
  } else {
    console.error(`[Header] Воркспейс с ID ${workspaceId} не найден в списке.`); // <-- ЛОГ 3 (на случай ошибки)
  }
};


  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      {/* Кнопка открытия сайдбара на мобильных (гамбургер) */}
      <button 
        type="button" 
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)} 
      >
        <span className="sr-only">Открыть сайдбар</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Мобильное название приложения - только для мобильных, с отступом от кнопки */}
      <div className="flex items-center group">
        <CircleStackIcon 
          className="h-8 w-8 text-indigo-600 group-hover:text-indigo-500 transition-colors" 
          aria-hidden="true" 
        />
        <span className="ml-3 text-2xl font-extrabold text-gray-900">БизнесПоток</span>
      </div>
      {/* Контент Header (отображается справа) */}
      <div className="flex-1 flex justify-end gap-x-4 sm:gap-x-6">
        {/* НОВОЕ: Дропдаун для переключения рабочих пространств */}
        {isAuthenticated && workspaces && workspaces.length > 0 && ( // Показываем, если есть воркспейсы
            <Menu as="div" className="relative hidden lg:flex items-center">
                <Menu.Button className="-m-1.5 flex items-center p-1.5 text-sm font-semibold leading-6 text-gray-900">
                    <span className="truncate max-w-[150px]">{activeWorkspace?.name || "Выберите компанию"}</span>
                    <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
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
                    <Menu.Items className="absolute left-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                        {workspaces.map(ws => (
                            <Menu.Item key={ws.id}>
                                {({ active }) => (
                                    <button
                                        onClick={() => handleWorkspaceChange(ws.id)}
                                        className={classNames(
                                            active ? 'bg-gray-50' : '',
                                            'block px-3 py-1 text-sm leading-6 text-gray-700 w-full text-left'
                                        )}
                                    >
                                        {ws.name} {ws.id === activeWorkspace?.id && ' (текущая)'}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>
        )}
        {/* Кнопка "Добавить компанию" */}
        <button 
          type="button" 
          className="hidden lg:flex items-center p-2.5 text-indigo-600 hover:text-indigo-500" 
          onClick={() => setShowWorkspaceModal(true)}
        >
            <span className="sr-only">Добавить компанию</span>
            <PlusIcon className="h-6 w-6" aria-hidden="true" />
        </button>

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
                {/* <Menu.Item>
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
                </Menu.Item> */}
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

      {/* Модальное окно для добавления компании */}
      <Modal isOpen={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)} title="Добавить новую компанию">
        <WorkspaceForm onSuccess={handleNewWorkspaceSuccess} onCancel={() => setShowWorkspaceModal(false)} />
      </Modal>
    </div>
  );
};

export default Header;