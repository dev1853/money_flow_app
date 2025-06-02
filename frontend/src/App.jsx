// src/App.jsx
import { Routes, Route, Outlet, Navigate, useLocation, Link  } from 'react-router-dom'; // 1. Импортируем Navigate и useLocation
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { useAuth } from './contexts/AuthContext'; // 2. Импортируем useAuth

// Импортируем наши страницы
import DdsArticlesPage from './pages/DdsArticlesPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import LoginPage from './pages/LoginPage';
import DdsReportPage from './pages/DdsReportPage';
import AccountBalancesReportPage from './pages/AccountBalancesReportPage';
import DashboardPage from './pages/DashboardPage';
import AdminPanelPage from './pages/AdminPanelPage';
import RegisterPage from './pages/RegisterPage';

// Можно оставить заглушки для страниц, которые еще не созданы
const SettingsPage = () => (<div className="p-4"><h1 className="text-2xl">Настройки (в разработке)</h1></div>);
const NotFoundPage = () => (<div className="p-4 text-center"><h1 className="text-4xl font-bold text-red-500">404 - Страница не найдена</h1><Link to="/" className="text-indigo-600 hover:underline">На главную</Link></div>);


// Компонент-обертка для страниц с основным макетом приложения (теперь он защищенный)
const ProtectedRoutesWithMainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth(); // 3. Получаем статус аутентификации и загрузки
  const location = useLocation(); // Для передачи state при редиректе

  if (isLoading) {
    // Показываем заглушку или спиннер, пока идет проверка аутентификации
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <svg className="mx-auto h-16 w-16 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Если пользователь не аутентифицирован, перенаправляем на страницу входа
    // state: { from: location } позволяет вернуться на предыдущую страницу после логина
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если аутентифицирован, показываем основной макет с контентом
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Компонент-обертка для страниц аутентификации (без изменений)
const AppWithAuthLayout = () => (
  <AuthLayout>
    <Outlet />
  </AuthLayout>
);

function App() {
  return (
    <Routes>
      {/* ... (маршруты для AuthLayout) ... */}
      <Route element={<AppWithAuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />ы       
      </Route>

      <Route element={<ProtectedRoutesWithMainLayout />}>
        <Route path="/" element={<DashboardPage />} /> {/* <-- 2. Главная страница теперь Дашборд */}
        <Route path="/dashboard" element={<DashboardPage />} /> {/* <-- 3. Явный маршрут для Дашборда */}
        <Route path="/articles" element={<DdsArticlesPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports/dds" element={<DdsReportPage />} />
        <Route path="/reports/account-balances" element={<AccountBalancesReportPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;