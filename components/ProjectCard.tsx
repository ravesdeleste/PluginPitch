
import React from 'react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onVote: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onVote }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
        <p className="text-gray-300 mb-4">{project.description}</p>
      </div>
      <button
        onClick={() => onVote(project.id)}
        className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800 transition-transform duration-200 hover:scale-105"
      >
        Votar por este proyecto
      </button>
    </div>
  );
};

export default ProjectCard;
