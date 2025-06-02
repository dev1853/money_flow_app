// src/components/Modal.jsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) {
  const showModal = typeof isOpen === 'boolean' ? isOpen : false;

  return (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Оверлей */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto"> {/* z-index добавлен для гарантии */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Для этого Transition.Child мы явно укажем as="div", 
                чтобы он создал DOM-элемент, на который Headless UI сможет повесить свои атрибуты.
                Этот div будет служить контейнером для Dialog.Panel.
            */}
            <Transition.Child
              as="div" // <-- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Явно указываем, что это div
              className="w-full max-w-2xl" // Переносим классы для позиционирования и размера сюда
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500" // Убрал sm: стили для простоты, кнопка всегда будет там
                      onClick={onClose}
                  >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      <span className="sr-only">Закрыть</span>
                  </button>
                </div>
                <div className="mt-4">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}