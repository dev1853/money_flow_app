// src/App.jsx
import { Routes, Route, Outlet, Navigate, useLocation, Link  } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import BudgetsPage from './pages/BudgetsPage'; 
import BudgetStatusPage from './pages/BudgetStatusPage'; 
import PaymentCalendarPage from './pages/PaymentCalendarPage';
import ContractsPage from './pages/ContractsPage'; 
import NotFoundPage from './pages/NotFoundPage'; 
import CounterpartiesPage from './pages/CounterpartiesPage'; 

// Можно оставить заглушки для страниц, которые еще не созданы
const SettingsPage = () => (<div className="p-4"><h1 className="text-2xl">Настройки (в разработке)</h1></div>);

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
<Route element={<ProtectedRoute />}>
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
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/budgets/:budgetId/status" element={<BudgetStatusPage />} />
        <Route path="/payment-calendar" element={<PaymentCalendarPage />} />
        <Route path="contracts" element={<ContractsPage />} /> 
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
        <Route path="counterparties" element={<CounterpartiesPage />} /> 
</Route>

        {/* Маршрут для 404 страницы */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
);
}

export default App;