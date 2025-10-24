import React from 'react';

interface EmailVerificationScreenProps {
  userEmail: string;
  onResend?: () => void;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ userEmail, onResend }) => {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-xl shadow-lg text-center">
      <div className="mb-6">
        <div className="inline-block p-4 bg-blue-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white">Verifica tu Email</h2>
      </div>

      <div className="space-y-4">
        <p className="text-gray-300 text-lg">
          Hemos enviado un link de verificación a:
        </p>
        <p className="text-yellow-400 font-bold text-xl break-all bg-slate-700 p-3 rounded">
          {userEmail}
        </p>

        <div className="bg-slate-700 p-4 rounded-lg space-y-3 text-left">
          <h3 className="text-white font-semibold">¿Qué hacer ahora?</h3>
          <ol className="text-gray-300 space-y-2 text-sm list-decimal list-inside">
            <li>Abre tu bandeja de entrada de email</li>
            <li>Busca el email de "PluginPitch"</li>
            <li>Haz clic en el link "Verificar email"</li>
            <li>Serás automáticamente redirigido para votar</li>
          </ol>
        </div>

        <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg text-left">
          <p className="text-blue-200 text-sm">
            <span className="font-semibold">💡 Tip:</span> Si no ves el email, revisa tu carpeta de spam o espera unos segundos y recarga la página.
          </p>
        </div>
      </div>

      {onResend && (
        <button
          onClick={onResend}
          className="w-full py-2 px-4 text-sm text-blue-400 hover:text-blue-300 underline transition"
        >
          ¿No recibiste el email? Haz clic para reenviar
        </button>
      )}

      <p className="text-xs text-gray-500 pt-4">
        Este link expira en 1 hora por razones de seguridad.
      </p>
    </div>
  );
};

export default EmailVerificationScreen;
