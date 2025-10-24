
import React, { useState } from 'react';
import { validateAdminCredentials } from '../services/sessionManager';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await validateAdminCredentials(key);
    if (result.success) {
      onLogin();
    } else {
      setError(result.message || 'Error al validar credenciales');
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-sm p-8 space-y-6 bg-slate-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-white">Acceso de Administrador</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="admin-key" className="sr-only">
            Admin Key
          </label>
          <input
            id="admin-key"
            name="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Admin Key"
          />
        </div>
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800"
          >
            {isLoading ? 'Validando...' : 'Ingresar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
