
import React, { useState } from 'react';
import { sendEmailVerificationLink } from '../services/sessionManager';

interface RegistrationFormProps {
  onEmailSent: (email: string, userName: string, isJury: boolean) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onEmailSent }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [juryCode, setJuryCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Nombre y Correo son requeridos.');
      return;
    }

    setIsLoading(true);
    setError('');

    const isJury = juryCode.trim() === import.meta.env.VITE_JURY_CODE;
    const result = await sendEmailVerificationLink(email, name, isJury);

    if (result.success) {
      onEmailSent(email, name, isJury);
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-xl shadow-lg">
      <div className="flex flex-col items-center gap-3 mb-4">
        <img
          src="/images/logo-plugin.jpeg"
          alt="Plugin Pitch Logo"
          className="w-14 h-14 rounded-lg shadow-md object-cover"
        />
        <h1 className="text-3xl font-bold text-center text-white">Plugin Pitch</h1>
        <p className="text-xs text-slate-400 text-center">Plataforma de Votación</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-300">
            Nombre Completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-300">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label htmlFor="jury-code" className="text-sm font-medium text-gray-300">
            Código de Jurado (Opcional)
          </label>
          <input
            id="jury-code"
            name="jury-code"
            type="text"
            value={juryCode}
            onChange={(e) => setJuryCode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Ingresa el código si eres jurado"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-slate-800 transition-transform duration-200 hover:scale-105"
          >
            {isLoading ? 'Validando datos...' : 'Ingresar y Votar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
