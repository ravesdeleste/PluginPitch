import React from 'react';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import Spinner from './Spinner';

interface VotingScreenProps {
  projects: Project[];
  onVote: (projectId: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;
}

const VotingScreen: React.FC<VotingScreenProps> = ({ projects, onVote, isLoading, isSubmitting }) => {
    if (isLoading) {
        return <Spinner />;
    }
  return (
    <div className="w-full max-w-4xl mx-auto px-4 relative">
       {isSubmitting && (
        <div className="absolute inset-0 bg-slate-900 bg-opacity-80 flex justify-center items-center z-10 rounded-lg">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-white">Registrando tu voto...</p>
          </div>
        </div>
      )}
      <h2 className="text-3xl font-bold text-center text-white mb-8">Elige tu Proyecto Favorito</h2>
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onVote={onVote} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">No hay proyectos para votar en este momento. Vuelve más tarde.</p>
      )}
    </div>
  );
};

export default VotingScreen;