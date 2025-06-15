// src/layouts/MainLayout.jsx
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children }) => { 
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Основной контент */}
      <div className="flex-1 flex flex-col w-full overflow-x-hidden"> 
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 py-8"> 
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;