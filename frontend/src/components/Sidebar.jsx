// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon, // Для Дашборда
  DocumentDuplicateIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon, // Использовали для лого "Финансы"
  ChartPieIcon,      // Для Отчета ДДС
  ScaleIcon          // Для Отчета Остатки ДС
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  // Основное меню
  const navigation = [
    { name: 'Дашборд', href: '/dashboard', icon: ChartBarIcon },
    { name: 'Транзакции', href: '/transactions', icon: ArrowsRightLeftIcon },
  ];
  // Справочники
  const directories = [
    { name: 'Статьи ДДС', href: '/articles', icon: DocumentDuplicateIcon },
    { name: 'Счета', href: '/accounts', icon: CreditCardIcon },
    // Сюда можно будет добавить Контрагентов
  ];
  // Отчеты
  const reports = [
    { name: 'Отчет ДДС', href: '/reports/dds', icon: ChartPieIcon },
    { name: 'Отчет Остатки ДС', href: '/reports/account-balances', icon: ScaleIcon },
  ];

  // Функция для рендеринга элементов навигации
  const renderNavItems = (items) => {
    return items.map((item) => {
      // Для Дашборда, "/" и "/dashboard" считаем активными
      const isActive = item.href === '/' 
        ? location.pathname === '/' || location.pathname === '/dashboard'
        : location.pathname.startsWith(item.href);
      
      // Для Статей ДДС, если текущий путь /articles или / (если /articles это главная для них)
      // Это условие нужно будет уточнить в зависимости от вашей логики главной страницы для статей.
      // Пока что, если location.pathname.startsWith(item.href) - это должно работать для большинства случаев.

      return (
        <li key={item.name}>
          <Link
            to={item.href}
            onClick={() => sidebarOpen && setSidebarOpen(false)} // Закрывать при клике на мобильных
            className={`
              group flex items-center rounded-md px-3 py-2.5 text-sm font-medium
              transition-colors duration-150 ease-in-out
              ${isActive
                ? 'bg-indigo-600 text-white shadow-sm' // Активная ссылка
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Неактивная ссылка
              }
            `}
          >
            <item.icon 
              className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} 
              aria-hidden="true" />
            {item.name}
          </Link>
        </li>
      );
    });
  };


  return (
    <>
      {/* Мобильный оверлей */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/70 z-30" // Увеличил немного прозрачность
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Сайдбар */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col 
                    bg-white border-r border-gray-200 shadow-lg
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    lg:translate-x-0 lg:static lg:inset-auto`}
      >
        {/* Логотип/Название */}
        <div className="flex h-20 shrink-0 items-center justify-center px-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center group text-decoration-none">
            <ArrowTrendingUpIcon 
              className="h-8 w-8 text-indigo-600 group-hover:text-indigo-500 transition-colors" 
              aria-hidden="true" 
            />
            <span className="ml-3 text-2xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
              Финансы
            </span>
          </Link>
        </div>

        {/* Навигация */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
              Основное
            </h3>
            <ul role="list" className="space-y-1">
              {renderNavItems(navigation)}
            </ul>
          </div>
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
              Справочники
            </h3>
            <ul role="list" className="space-y-1">
              {renderNavItems(directories)}
            </ul>
          </div>
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
              Отчеты
            </h3>
            <ul role="list" className="space-y-1">
              {renderNavItems(reports)}
            </ul>
          </div>

          {/* Настройки внизу */}
          <div className="mt-auto"> {/* Прижимает Настройки к низу */}
            <ul role="list" className="space-y-1">
                <li>
                    <Link
                        to="/settings" // Предполагаем, что будет страница настроек
                        onClick={() => sidebarOpen && setSidebarOpen(false)}
                        className={`
                            group flex items-center rounded-md px-3 py-2.5 text-sm font-medium
                            transition-colors duration-150 ease-in-out
                            ${location.pathname.startsWith('/settings')
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }
                        `}
                    >
                        <Cog6ToothIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${location.pathname.startsWith('/settings') ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} aria-hidden="true" />
                        Настройки
                    </Link>
                </li>
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;