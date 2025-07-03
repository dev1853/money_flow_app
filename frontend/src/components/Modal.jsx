// frontend/src/components/Modal.jsx (после правок)
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({
  isOpen,
  onClose,
  title,
  children, // Основное содержимое модального окна (сама форма)
  footer,   // Новый проп для кнопок или другого содержимого футера
  maxWidth = 'max-w-2xl',
  formId // Добавляем formId
}) {
  const showModal = typeof isOpen === 'boolean' ? isOpen : false;

  return (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-50"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all ${maxWidth}`}>
                {/* Хедер модального окна */}
                {(title || onClose) && (
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    {title && (
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-800">
                        {title}
                      </Dialog.Title>
                    )}
                    <button
                        type="button"
                        className={`p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!title ? 'ml-auto' : ''}`}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Тело модального окна */}
                <div className="p-6 text-sm text-gray-700">
                  {/* Здесь будет рендериться ArticleForm, AccountForm, TransactionForm и т.д. */}
                  {/* Они будут иметь свой собственный formId */}
                  {children}
                </div>

                {/* Футер модального окна (если передан) */}
                {footer && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    {/* Этот footer должен содержать кнопки, которые будут использовать form={formId} */}
                    {/* Например: <Button type="submit" form={formId}>Сохранить</Button> */}
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}