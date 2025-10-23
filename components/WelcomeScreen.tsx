import React from 'react';

interface WelcomeScreenProps {
  onVoteClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onVoteClick }) => {
  return (
    <div className="w-full max-w-md p-8 text-center bg-slate-800 rounded-xl shadow-lg animate-fade-in">
      <h1 className="text-5xl font-bold text-white mb-6">Bienvenido a Plugin Pitch</h1>
      <p className="text-lg text-gray-300 mb-8">
        Tu voto es fundamental para decidir el futuro de la innovación.
      </p>
      <button
        onClick={onVoteClick}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-slate-800 transition-transform duration-200 hover:scale-105"
      >
        VOTAR
      </button>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
