// src/App.jsx
import { Routes, Route, Outlet, Navigate, useLocation, Link  } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { useAuth } from './contexts/AuthContext';
import Loader from './components/Loader'; // <--- ИЗМЕНЕНИЕ: ДОБАВЛЕН ЭТОТ ИМПОРТ

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
  const { isAuthenticated, isLoading } = useAuth(); // Получаем статус аутентификации и загрузки
  const location = useLocation(); // Для передачи state при редиректе

  if (isLoading) { // Это isLoading из useAuth(), который отвечает за проверку токена
    // Показываем заглушку или спиннер, пока идет проверка аутентификации
    return (
      // Этот внешний div отвечает за полноэкранное центрирование
      <div className="flex justify-center items-center min-h-screen bg-gray-100"> {/* */}
        {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
        <Loader 
          size="h-16 w-16" // Задаем размер как был у оригинального SVG
          spinnerColor="text-indigo-600" // Цвет как у оригинального SVG
        />
        {/* --- КОНЕЦ ИЗМЕНЕНИЯ --- */}
      </div>
    );
  }

  if (!isAuthenticated) {
    // Если пользователь не аутентифицирован, перенаправляем на страницу входа
    // state: { from: location } позволяет вернуться на предыдущую страницу после логина
    return <Navigate to="/login" state={{ from: location }} replace />; //
  }

  // Если аутентифицирован, показываем основной макет с контентом
  return (
    <MainLayout> {/* */}
      <Outlet /> {/* */}
    </MainLayout>
  );
};

// Компонент-обертка для страниц аутентификации (без изменений)
const AppWithAuthLayout = () => (
  <AuthLayout> {/* */}
    <Outlet /> {/* */}
  </AuthLayout>
);

function App() {
  return (
    <Routes> {/* */}
      {/* ... (маршруты для AuthLayout) ... */}
      <Route element={<AppWithAuthLayout />}> {/* */}
        <Route path="/login" element={<LoginPage />} /> {/* */}
        <Route path="/register" element={<RegisterPage />} />       
      </Route>

      <Route element={<ProtectedRoutesWithMainLayout />}> {/* */}
        <Route path="/" element={<DashboardPage />} /> {/* */}
        <Route path="/dashboard" element={<DashboardPage />} /> {/* */}
        <Route path="/articles" element={<DdsArticlesPage />} /> {/* */}
        <Route path="/accounts" element={<AccountsPage />} /> {/* */}
        <Route path="/transactions" element={<TransactionsPage />} /> {/* */}
        <Route path="/reports/dds" element={<DdsReportPage />} /> {/* */}
        <Route path="/reports/account-balances" element={<AccountBalancesReportPage />} /> {/* */}
        <Route path="/admin" element={<AdminPanelPage />} /> {/* */}
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
      </Route>
      
      <Route path="*" element={<NotFoundPage />} /> {/* */}
    </Routes>
  );
}

export default App; {/* */}