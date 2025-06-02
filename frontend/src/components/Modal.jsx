// frontend/src/components/Modal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl' // Проп для управления максимальной шириной
}) {
  const showModal = typeof isOpen === 'boolean' ? isOpen : false;

  return (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Оверлей */}
        <Transition.Child
          as="div" 
          className="fixed inset-0 bg-black bg-opacity-100"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Дочерний div здесь больше не нужен, так как Transition.Child сам стал оверлеем */}
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as="div" // Этот Transition.Child для панели модального окна
              className={`w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all ${maxWidth}`}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Этот div служит контейнером для содержимого, заменяя Dialog.Panel */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  {title && (
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                  )}
                  {/* Кнопка закрытия */}
                  <button
                      type="button"
                      className={`p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${title ? '' : 'ml-auto'}`}
                      onClick={onClose}
                  >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      <span className="sr-only">Закрыть</span>
                  </button>
                </div>
                <div className={title ? "mt-4" : "mt-0"}> {/* Убираем отступ если нет заголовка */}
                  {children}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}