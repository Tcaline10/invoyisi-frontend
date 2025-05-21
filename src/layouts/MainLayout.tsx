import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Navigation/Sidebar';
import Header from '../components/Navigation/Header';
import UserGuideButton from '../components/UserGuide/UserGuideButton';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 z-20 transition-all duration-300 transform lg:transform-none lg:opacity-100 lg:relative lg:flex ${
        sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'
      }`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet />
        </main>

        {/* User Guide Button (fixed position) */}
        <div className="fixed bottom-6 right-6 z-10">
          <UserGuideButton />
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default MainLayout;