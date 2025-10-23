import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, addDoc, Timestamp } from 'firebase/firestore';
import { Project, Winner, UserVoteInfo } from './types';
import RegistrationForm from './components/RegistrationForm';
import VotingScreen from './components/VotingScreen';
import VotedScreen from './components/VotedScreen';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import Spinner from './components/Spinner';
import WinnerModal from './components/WinnerModal';
import ThankYouScreen from './components/ThankYouScreen';
import WelcomeScreen from './components/WelcomeScreen';

enum AppState {
  LOADING,
  WELCOME,
  REGISTRATION,
  VOTING,
  VOTED,
  ADMIN_LOGIN,
  ADMIN_PANEL,
  THANK_YOU,
}

const getLocalUserId = (): string => {
  let userId = localStorage.getItem('localUserId');
  if (!userId) {
    userId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('localUserId', userId);
  }
  return userId;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userVoteInfo, setUserVoteInfo] = useState<UserVoteInfo | null>(null);
  const [winnerData, setWinnerData] = useState<Winner | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);


  useEffect(() => {
    const checkUserStatus = async () => {
      const userId = getLocalUserId();
      
      if (localStorage.getItem('isAdmin') === 'true') {
        setAppState(AppState.ADMIN_PANEL);
        return;
      }

      const storedVoteInfo = localStorage.getItem(`voteInfo-${userId}`);
      if (storedVoteInfo) {
        setUserVoteInfo(JSON.parse(storedVoteInfo));
        setAppState(AppState.VOTED);
        return;
      }

      try {
        const votesQuery = query(collection(db, 'votes'), where('userId', '==', userId));
        const querySnapshot = await getDocs(votesQuery);
        if (!querySnapshot.empty) {
          const voteDoc = querySnapshot.docs[0].data();
          const info = { projectId: voteDoc.projectId, isJury: voteDoc.weight === 2 };
          localStorage.setItem(`voteInfo-${userId}`, JSON.stringify(info));
          setUserVoteInfo(info);
          setAppState(AppState.VOTED);
        } else {
          setAppState(AppState.WELCOME);
        }
      } catch (error) {
          console.error("Error checking user status in Firestore:", error);
          setAppState(AppState.WELCOME);
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    const q = collection(db, 'projects');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const winnerDocRef = doc(db, 'results', 'winner');
    const unsubscribe = onSnapshot(winnerDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as Winner;
            if(data.winnerId){
                setWinnerData(data);
                setIsWinnerModalOpen(true);
            }
        }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (appState === AppState.THANK_YOU) {
      const timer = setTimeout(() => {
        setAppState(AppState.VOTED);
      }, 3000); // Show thank you screen for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [appState]);


  const handleRegister = (isJury: boolean) => {
    setUserVoteInfo({ projectId: '', isJury });
    setAppState(AppState.VOTING);
  };

  const handleVote = async (projectId: string) => {
    if (userVoteInfo && !isSubmittingVote) {
      setIsSubmittingVote(true);
      try {
        const userId = getLocalUserId();
        const voteData = {
          projectId,
          userId: userId,
          weight: userVoteInfo.isJury ? 2 : 1,
          timestamp: Timestamp.now(),
        };
        await addDoc(collection(db, 'votes'), voteData);
        const newVoteInfo = { ...userVoteInfo, projectId };
        localStorage.setItem(`voteInfo-${userId}`, JSON.stringify(newVoteInfo));
        setUserVoteInfo(newVoteInfo);
        setAppState(AppState.THANK_YOU);
      } catch(error) {
        console.error("Error submitting vote:", error);
        alert("Hubo un error al registrar tu voto. Por favor, inténtalo de nuevo. Asegúrate de que la configuración de Firebase sea correcta.");
      } finally {
        setIsSubmittingVote(false);
      }
    }
  };

  const handleAdminLogin = () => {
    localStorage.setItem('isAdmin', 'true');
    setAppState(AppState.ADMIN_PANEL);
  };
  
  const handleAdminSignOut = () => {
    localStorage.removeItem('isAdmin');
    setAppState(AppState.WELCOME);
  };

  const renderContent = () => {
    const votedProject = projects.find(p => p.id === userVoteInfo?.projectId);
    
    switch (appState) {
      case AppState.LOADING:
        return <Spinner />;
      case AppState.WELCOME:
        return <WelcomeScreen onVoteClick={() => setAppState(AppState.REGISTRATION)} />;
      case AppState.REGISTRATION:
        return <RegistrationForm onRegister={handleRegister} />;
      case AppState.VOTING:
        return <VotingScreen projects={projects} onVote={handleVote} isLoading={projects.length === 0} isSubmitting={isSubmittingVote} />;
      case AppState.THANK_YOU:
        return <ThankYouScreen />;
      case AppState.VOTED:
        return <VotedScreen votedProject={votedProject} isJury={userVoteInfo?.isJury || false} />;
      case AppState.ADMIN_LOGIN:
        return <AdminLogin onLogin={handleAdminLogin} />;
      case AppState.ADMIN_PANEL:
        return <AdminPanel projects={projects} onSignOut={handleAdminSignOut} />;
      default:
        return <Spinner />;
    }
  };

  const winnerProject = projects.find(p => p.id === winnerData?.winnerId);
  const userVotedForWinner = userVoteInfo?.projectId === winnerData?.winnerId;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative">
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
      <footer className="w-full text-center p-4 text-gray-500 text-sm">
        <a href="#" onClick={(e) => { e.preventDefault(); setAppState(AppState.ADMIN_LOGIN); }} className="hover:text-blue-400 transition">
          Admin Access
        </a>
        <p className="mt-1">Plugin Pitch</p>
      </footer>
      <WinnerModal 
        isOpen={isWinnerModalOpen} 
        winnerProject={winnerProject} 
        userVotedForWinner={userVotedForWinner} 
      />
    </div>
  );
};

export default App;