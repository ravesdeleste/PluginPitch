import React from 'react';

interface HeaderProps {
  userName?: string;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, isLoggedIn, onLogout }) => {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-plugin.jpeg"
            alt="Plugin Pitch Logo"
            className="w-10 h-10 rounded-lg shadow-md object-cover"
          />
          <div>
            <h1 className="text-xl font-bold text-white">Plugin Pitch</h1>
            <p className="text-xs text-slate-400">Voting Platform</p>
          </div>
        </div>

        {/* User Info & Logout */}
        {isLoggedIn && userName && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-300">Bienvenido</p>
              <p className="text-sm font-semibold text-white truncate max-w-xs">{userName}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
