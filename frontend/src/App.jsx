// src/App.jsx
import { Routes, Route, Outlet, Navigate, useLocation, Link  } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { useAuth } from './contexts/AuthContext';
import Loader from './components/Loader'; 

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
import MappingRulesPage from './pages/MappingRulesPage'; 
import ProfitLossReportPage from './pages/ProfitLossReportPage';
import HelpPage from './pages/HelpPage';

// Можно оставить заглушки для страниц, которые еще не созданы
const SettingsPage = () => (<div className="p-4"><h1 className="text-2xl">Настройки (в разработке)</h1></div>);
const NotFoundPage = () => (<div className="p-4 text-center"><h1 className="text-4xl font-bold text-red-500">404 - Страница не найдена</h1><Link to="/" className="text-indigo-600 hover:underline">На главную</Link></div>);


// Компонент-обертка для страниц с основным макетом приложения (теперь он защищенный)
const ProtectedRoutesWithMainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth(); // Получаем статус аутентификации и загрузки
  const location = useLocation();

  if (isLoading) {
    return <Loader />; // Показываем лоадер, пока идет проверка аутентификации
  }

  if (!isAuthenticated) {
    // Если не аутентифицирован, перенаправляем на страницу входа, сохраняя текущий путь
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если аутентифицирован, показываем основной макет с контентом
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Компонент-обертка для страниц аутентификации
const AppWithAuthLayout = () => (
  <AuthLayout>
    <Outlet />
  </AuthLayout>
);

function App() {
  return (
    <Routes>
      {/* Маршруты для страниц без аутентификации, использующие AuthLayout */}
      <Route element={<AppWithAuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />       
      </Route>

      {/* Защищенные маршруты, требующие аутентификации и использующие MainLayout */}
      <Route element={<ProtectedRoutesWithMainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/articles" element={<DdsArticlesPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports/dds" element={<DdsReportPage />} />
        <Route path="/reports/pnl" element={<ProfitLossReportPage />} />
        <Route path="/reports/account-balances" element={<AccountBalancesReportPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="/mapping-rules" element={<MappingRulesPage />} />  
        <Route path="/help" element={<HelpPage />} />
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
      </Route>
      
      {/* Маршрут для 404 страницы */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;