
import React from 'react';
import { Project } from '../types';

interface WinnerModalProps {
  isOpen: boolean;
  winnerProject: Project | undefined;
  userVotedForWinner: boolean;
}

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, winnerProject, userVotedForWinner }) => {
  if (!isOpen || !winnerProject) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-2 border-yellow-400 transform transition-all scale-100 animate-fade-in">
        {userVotedForWinner ? (
          <>
            <h2 className="text-4xl font-black text-green-400 mb-4">¡Felicidades!</h2>
            <p className="text-lg text-white mb-4">
              Tu voto fue crucial para el proyecto ganador: <span className="font-bold text-yellow-400">{winnerProject.name}</span>.
            </p>
            <p className="text-white">Tu código de premio es:</p>
            <p className="text-2xl font-bold bg-slate-700 text-yellow-300 rounded-lg py-2 px-4 inline-block my-4">PITCHWINNER2025</p>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-black text-blue-400 mb-4">¡El Ganador es!</h2>
            <p className="text-2xl font-bold text-yellow-400 mb-4">{winnerProject.name}</p>
            <p className="text-lg text-white">Gracias por tu participación.</p>
          </>
        )}
        <p className="text-md text-gray-300 mt-6 italic">
          No te olvides de seguirlo en redes y apoyar al emprendedor local.
        </p>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WinnerModal;
