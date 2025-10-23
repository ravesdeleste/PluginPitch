import React from 'react';
import { Project } from '../types';

interface VotedScreenProps {
  votedProject: Project | undefined;
  isJury: boolean;
}


const VotedScreen: React.FC<VotedScreenProps> = ({ votedProject, isJury }) => {
  return (
    <div className="text-center text-white bg-slate-800 p-10 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-white mb-4">Tu voto ha sido registrado.</h2>
      {votedProject && (
        <p className="text-xl text-gray-200 mb-4">
          Votaste por: <span className="font-bold text-yellow-400">{votedProject.name}</span>
          {isJury && <span className="text-sm text-blue-400 ml-2">(Voto de Jurado)</span>}
        </p>
      )}
      <p className="text-lg text-gray-300">
        Espera al anuncio del ganador para ver si tu proyecto fue el elegido. ¡Mucha suerte!
      </p>
    </div>
  );
};

export default VotedScreen;