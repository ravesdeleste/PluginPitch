import React, { useState, useEffect, useMemo } from 'react';
import { Project, Vote } from '../types';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getCurrentAdminSession } from '../services/sessionManager';

interface AdminPanelProps {
  projects: Project[];
  onSignOut: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, onSignOut }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [winnerId, setWinnerId] = useState('');
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Verify admin session on component mount
  useEffect(() => {
    const adminSession = getCurrentAdminSession();
    if (!adminSession) {
      onSignOut(); // Redirect to welcome if no valid session
      return;
    }
    setIsAuthorized(true);
  }, [onSignOut]);

  useEffect(() => {
    const votesQuery = collection(db, 'votes');
    const unsubscribe = onSnapshot(votesQuery, (snapshot) => {
        const votesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
        setVotes(votesData);
    });
    return () => unsubscribe();
  }, []);

  const voteResults = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach(p => counts.set(p.id, 0));

    votes.forEach(vote => {
        const currentCount = counts.get(vote.projectId) || 0;
        counts.set(vote.projectId, currentCount + vote.weight);
    });

    return projects.map(project => ({
        ...project,
        voteCount: counts.get(project.id) || 0,
    })).sort((a, b) => b.voteCount - a.voteCount);
  }, [projects, votes]);

  const totalVotes = useMemo(() => voteResults.reduce((sum, p) => sum + p.voteCount, 0), [voteResults]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && newProjectDesc) {
      await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        description: newProjectDesc,
      });
      setNewProjectName('');
      setNewProjectDesc('');
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
        const projectDoc = doc(db, 'projects', editingProject.id);
        await updateDoc(projectDoc, { name: editingProject.name, description: editingProject.description });
        setEditingProject(null);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
        const projectDoc = doc(db, 'projects', id);
        await deleteDoc(projectDoc);
    }
  };

  const handleDeclareWinner = async () => {
    if (winnerId && window.confirm(`¿Estás seguro de declarar a "${projects.find(p=>p.id === winnerId)?.name}" como ganador?`)) {
      const winnerDoc = doc(db, 'results', 'winner');
      await setDoc(winnerDoc, {
        winnerId: winnerId,
        announcedAt: Timestamp.now(),
      });
      alert('Ganador anunciado!');
    } else if(!winnerId) {
        alert('Por favor, selecciona un proyecto ganador.')
    }
  };

  if (!isAuthorized) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800 text-white rounded-xl shadow-lg">
        <p className="text-center text-yellow-400">Verificando permisos de administrador...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800 text-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-yellow-400">Panel de Administración</h2>
        <button onClick={onSignOut} className="text-sm text-blue-400 hover:underline">Cerrar Sesión</button>
      </div>
      
      {/* Module A - Carga de Proyectos */}
      <div className="bg-slate-700 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-semibold mb-4 border-b border-slate-600 pb-2">Gestionar Proyectos</h3>
        {editingProject ? (
             <form onSubmit={handleUpdateProject} className="space-y-4 mb-6">
                <input type="text" value={editingProject.name} onChange={e => setEditingProject({...editingProject, name: e.target.value})} className="w-full p-2 bg-slate-800 rounded" />
                <textarea value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full p-2 bg-slate-800 rounded h-24" />
                <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">Guardar Cambios</button>
                    <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">Cancelar</button>
                </div>
            </form>
        ) : (
            <form onSubmit={handleAddProject} className="space-y-4 mb-6">
                <input type="text" placeholder="Nombre del Proyecto" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full p-2 bg-slate-800 rounded placeholder-gray-400" />
                <textarea placeholder="Descripción breve" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} className="w-full p-2 bg-slate-800 rounded placeholder-gray-400" />
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">Agregar Proyecto</button>
            </form>
        )}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {projects.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-slate-800 p-3 rounded">
                    <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-sm text-gray-400">{p.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingProject(p)} className="px-3 py-1 bg-yellow-500 text-slate-900 text-sm font-semibold rounded hover:bg-yellow-600">Editar</button>
                        <button onClick={() => handleDeleteProject(p.id)} className="px-3 py-1 bg-red-600 text-sm font-semibold rounded hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Module B - Anuncio del Ganador */}
      <div className="bg-slate-700 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 border-b border-slate-600 pb-2">Anunciar Ganador</h3>
        <div className="flex items-center gap-4">
            <select value={winnerId} onChange={e => setWinnerId(e.target.value)} className="flex-grow p-2 bg-slate-800 rounded border border-slate-600">
                <option value="">-- Selecciona un ganador --</option>
                {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            <button onClick={handleDeclareWinner} className="px-6 py-2 bg-yellow-400 text-slate-900 font-bold rounded hover:bg-yellow-500 transition-transform duration-200 hover:scale-105">Declarar Ganador</button>
        </div>
      </div>

      {/* Module C - Resultados de la Votación */}
      <div className="bg-slate-700 p-6 rounded-lg mt-8">
        <h3 className="text-xl font-semibold mb-4 border-b border-slate-600 pb-2">Resultados en Tiempo Real</h3>
        <div className="space-y-4">
          {voteResults.length > 0 || projects.length > 0 ? voteResults.map(result => {
            const percentage = totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0;
            return (
              <div key={result.id} className="bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{result.name}</span>
                  <span className="text-lg font-bold text-yellow-400">{result.voteCount} Voto(s)</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          }) : (
            <p className="text-gray-400 text-center">Aún no hay votos registrados.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;