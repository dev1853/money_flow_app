// frontend/src/layouts/MainLayout.jsx
import React, { useState, Fragment, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header'; 
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; 

// <--- ДОБАВЛЕНО: Функция classNames
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
// >>>>

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const panelRef = useRef(null);

  return (
    <>
      {/* Мобильное модальное окно сайдбара (для маленьких экранов) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          {/* Оверлей фона */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          {/* Панель сайдбара */}
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel 
                className="relative mr-16 flex w-full max-w-xs flex-1"
                ref={panelRef}
              >
                {/* Кнопка закрытия для мобильных */}
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                    <span className="sr-only">Закрыть сайдбар</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>

                {/* Sidebar компонент рендерится здесь. Он содержит весь контент сайдбара. */}
                <Sidebar setSidebarOpen={setSidebarOpen} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Десктопный сайдбар (всегда видим на больших экранах) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar компонент рендерится здесь. Он содержит весь контент сайдбара. */}
        <Sidebar setSidebarOpen={setSidebarOpen} />
      </div>


      {/* Основной контент (Main content area) */}
      <div className="lg:pl-72"> 
        

        {/* Header (для десктопа) - отображается здесь */}
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8"> 
            <Outlet /> 
          </div>
        </main>
      </div>
    </>
  );
}