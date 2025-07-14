import { Fragment, useState, useEffect } from 'react'; // Убрал неиспользуемый useRef
import { Link } from 'react-router-dom';
import { BellIcon, Bars3Icon, PlusIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react'; 
import Modal from './Modal';
import WorkspaceForm from './forms/WorkspaceForm';
import ThemeSwitcher from './ThemeSwitcher'; // <--- 1. ИМПОРТИРУЕМ ПЕРЕКЛЮЧАТЕЛЬ

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Header = ({ setSidebarOpen }) => { 
  const { isAuthenticated, user, logout, setActiveWorkspace, activeWorkspace, workspaces, fetchWorkspaces } = useAuth();
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  const handleNewWorkspaceSuccess = async (newWorkspace) => {
    setShowWorkspaceModal(false);
    if (newWorkspace) {
      await fetchWorkspaces();
      window.location.reload();
    }
  };
  
  const handleWorkspaceChange = (workspaceId) => {
    const newActiveWorkspace = workspaces.find(ws => ws.id === Number(workspaceId));
    if (newActiveWorkspace) {
      setActiveWorkspace(newActiveWorkspace);
      localStorage.setItem('activeWorkspaceId', newActiveWorkspace.id);
    } else {
      console.error(`[Header] Воркспейс с ID ${workspaceId} не найден.`);
    }
  };

  return (
    // <--- 2. ДОБАВЛЯЕМ КЛАССЫ ДЛЯ ТЕМНОЙ ТЕМЫ
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 shadow-sm sm:px-6 lg:px-8">
      {/* Кнопка-гамбургер */}
      <button 
        type="button" 
        // <--- Цвет иконки для темной темы
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
        onClick={() => setSidebarOpen(true)} 
      >
        <span className="sr-only">Открыть сайдбар</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Логотип */}
      {/* <div className="flex items-center group">
        <CircleStackIcon 
          className="h-8 w-8 text-indigo-600 group-hover:text-indigo-500 transition-colors" 
          aria-hidden="true" 
        />
        <span className="ml-3 text-2xl font-extrabold text-gray-900 dark:text-gray-100">БизнесПоток</span>
      </div> */}

      {/* Правая часть хедера */}
      <div className="flex-1 flex justify-end gap-x-4 sm:gap-x-6">
        {/* Дропдаун для воркспейсов */}
        {isAuthenticated && workspaces && workspaces.length > 0 && (
          <Menu as="div" className="relative hidden lg:flex items-center">
              <Menu.Button className="-m-1.5 flex items-center p-1.5 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-50">
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
                  {/* <--- Стили для выпадающего меню */}
                  <Menu.Items className="absolute left-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-white/10 focus:outline-none">
                      {workspaces.map(ws => (
                          <Menu.Item key={ws.id}>
                              {({ active }) => (
                                  <button
                                      onClick={() => handleWorkspaceChange(ws.id)}
                                      className={classNames(
                                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                                          'block px-3 py-1 text-sm leading-6 text-gray-700 dark:text-gray-300 w-full text-left'
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
        
        {/* <--- 3. ВСТАВЛЯЕМ НАШ ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ */}
        <div className="flex items-center">
            <ThemeSwitcher />
        </div>

        {/* Кнопка уведомлений */}
        <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <span className="sr-only">Посмотреть уведомления</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Разделитель */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10 dark:lg:bg-white/10" aria-hidden="true" />

        {/* Профиль дропдаун */}
        {isAuthenticated ? (
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <img
                className="h-8 w-8 rounded-full bg-gray-500" // Немного темнее фон
                src={`https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=374151&color=fff&bold=true`}
                alt=""
              />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200" aria-hidden="true">
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
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-white/10 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={classNames(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-700 dark:text-gray-300 w-full text-left'
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
          <Link to="/login" className="..."/>
        )}
      </div>

      {/* Модальное окно (не требует изменений) */}
      <Modal isOpen={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)} title="Добавить новую компанию">
        <WorkspaceForm onSuccess={handleNewWorkspaceSuccess} onCancel={() => setShowWorkspaceModal(false)} />
      </Modal>
    </div>
  );
};

export default Header;