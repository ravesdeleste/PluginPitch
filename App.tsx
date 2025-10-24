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
import Header from './components/Header';
import {
  getCurrentSession,
  getCurrentAdminSession,
  clearSession,
  clearAdminSession,
  getStoredVoteInfo,
  verifyEmailCode,
} from './services/sessionManager';
import EmailVerificationScreen from './components/EmailVerificationScreen';

enum AppState {
  LOADING,
  WELCOME,
  REGISTRATION,
  AWAITING_EMAIL_VERIFICATION,
  VOTING,
  VOTED,
  ADMIN_LOGIN,
  ADMIN_PANEL,
  THANK_YOU,
}

// Get userId from secure session storage
const getUserIdFromSession = (): string | null => {
  const session = getCurrentSession();
  return session ? session.userId : null;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userVoteInfo, setUserVoteInfo] = useState<UserVoteInfo | null>(null);
  const [winnerData, setWinnerData] = useState<Winner | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [emailVerificationProcessed, setEmailVerificationProcessed] = useState(false);

  // Handle email verification from Brevo link (runs once)
  useEffect(() => {
    // Check if URL contains code and email parameters from Brevo email
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const email = params.get('email');

    if (code && email && !emailVerificationProcessed) {
      setEmailVerificationProcessed(true);

      (async () => {
        try {
          const result = await verifyEmailCode(code, email);
          // Clean URL immediately after verification attempt
          window.history.replaceState({}, document.title, window.location.pathname);

          if (result.success && result.sessionData) {
            setUserVoteInfo({ projectId: '', isJury: result.sessionData.isJury });
            setAppState(AppState.VOTING);
          } else {
            alert(result.message);
            setAppState(AppState.WELCOME);
          }
        } catch (error) {
          console.error('Error verifying email:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
          alert('Error al verificar tu email. Por favor intenta de nuevo.');
          setAppState(AppState.WELCOME);
        }
      })();
      return;
    }

    // Normal status check (admin/user session)
    (async () => {
      const adminSession = getCurrentAdminSession();
      if (adminSession) {
        setAppState(AppState.ADMIN_PANEL);
        return;
      }

      const userSession = getCurrentSession();
      if (userSession) {
        const storedVote = await getStoredVoteInfo(userSession.userEmail);
        if (storedVote) {
          setUserVoteInfo(storedVote);
          setAppState(AppState.VOTED);
        } else {
          setAppState(AppState.VOTING);
        }
      } else {
        setAppState(AppState.WELCOME);
      }
    })();
  }, [emailVerificationProcessed]);

  // Load projects only when user is registered (avoid unnecessary queries)
  useEffect(() => {
    if (appState === AppState.LOADING) return;

    const q = collection(db, 'projects');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
    });
    return () => unsubscribe();
  }, [appState]);

  // Load winner only when user has voted (avoid unnecessary queries)
  useEffect(() => {
    if (appState !== AppState.VOTED && appState !== AppState.THANK_YOU) return;

    const winnerDocRef = doc(db, 'results', 'winner');
    const unsubscribe = onSnapshot(winnerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Winner;
        if (data.winnerId) {
          setWinnerData(data);
          setIsWinnerModalOpen(true);
        }
      }
    });
    return () => unsubscribe();
  }, [appState]);
  
  useEffect(() => {
    if (appState === AppState.THANK_YOU) {
      const timer = setTimeout(() => {
        setAppState(AppState.VOTED);
      }, 3000); // Show thank you screen for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [appState]);


  const handleEmailSent = (email: string, userName: string, isJury: boolean) => {
    // Email verification link has been sent
    setPendingVerificationEmail(email);
    setUserVoteInfo({ projectId: '', isJury });
    setAppState(AppState.AWAITING_EMAIL_VERIFICATION);
  };

  const handleResendVerificationEmail = async () => {
    if (pendingVerificationEmail && userVoteInfo) {
      const { sendEmailVerificationLink } = await import('./services/sessionManager');
      const result = await sendEmailVerificationLink(
        pendingVerificationEmail,
        'Usuario', // name no disponible aquí, pero no es crítico
        userVoteInfo.isJury
      );
      if (result.success) {
        alert('Email reenviado. Por favor revisa tu bandeja de entrada.');
      } else {
        alert(result.message);
      }
    }
  };

  const handleVote = async (projectId: string) => {
    const userSession = getCurrentSession();
    if (userVoteInfo && userSession) {
      setAppState(AppState.LOADING);
      try {
        const voteData = {
          projectId,
          userId: userSession.userId,
          userEmail: userSession.userEmail,
          weight: userSession.weight,
          timestamp: Timestamp.now(),
        };
        await addDoc(collection(db, 'votes'), voteData);
        const newVoteInfo = { ...userVoteInfo, projectId };
        setUserVoteInfo(newVoteInfo);
        setAppState(AppState.THANK_YOU);
      } catch(error) {
        console.error("Error submitting vote:", error);
        alert("Hubo un error al registrar tu voto. Por favor, inténtalo de nuevo. Asegúrate de que la configuración de Firebase sea correcta.");
        setAppState(AppState.VOTING);
      }
    }
  };

  const handleAdminLogin = () => {
    // Admin session is created in AdminLogin component via validateAdminCredentials
    setAppState(AppState.ADMIN_PANEL);
  };

  const handleLogout = async () => {
    const isAdmin = getCurrentAdminSession();
    const isVoter = getCurrentSession();

    if (isAdmin) {
      clearAdminSession();
    }
    if (isVoter) {
      await clearSession();
    }

    setAppState(AppState.WELCOME);
    setUserVoteInfo(null);
  };

  const renderContent = () => {
    const votedProject = projects.find(p => p.id === userVoteInfo?.projectId);

    switch (appState) {
      case AppState.LOADING:
        return <Spinner />;
      case AppState.WELCOME:
        return <WelcomeScreen onVoteClick={() => setAppState(AppState.REGISTRATION)} />;
      case AppState.REGISTRATION:
        return <RegistrationForm onEmailSent={handleEmailSent} />;
      case AppState.AWAITING_EMAIL_VERIFICATION:
        return (
          <EmailVerificationScreen
            userEmail={pendingVerificationEmail || ''}
            onResend={handleResendVerificationEmail}
          />
        );
      case AppState.VOTING:
        return <VotingScreen projects={projects} onVote={handleVote} isLoading={projects.length === 0} />;
      case AppState.THANK_YOU:
        return <ThankYouScreen />;
      case AppState.VOTED:
        return <VotedScreen votedProject={votedProject} isJury={userVoteInfo?.isJury || false} />;
      case AppState.ADMIN_LOGIN:
        return <AdminLogin onLogin={handleAdminLogin} />;
      case AppState.ADMIN_PANEL:
        return <AdminPanel projects={projects} onSignOut={handleLogout} />;
      default:
        return <Spinner />;
    }
  };

  const winnerProject = projects.find(p => p.id === winnerData?.winnerId);
  const userVotedForWinner = userVoteInfo?.projectId === winnerData?.winnerId;

  // Determine if header should be shown
  const showHeader = [
    AppState.VOTING,
    AppState.VOTED,
    AppState.THANK_YOU,
    AppState.ADMIN_PANEL,
  ].includes(appState);

  // Get current user info for header
  const currentUserSession = getCurrentSession();
  const currentAdminSession = getCurrentAdminSession();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative">
      {showHeader && (
        <Header
          userName={currentAdminSession?.userName || currentUserSession?.userName}
          isLoggedIn={showHeader}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-grow flex items-center justify-center p-4">
        {renderContent()}
      </main>

      {!showHeader && (
        <footer className="w-full text-center p-4 text-gray-500 text-sm">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setAppState(AppState.ADMIN_LOGIN);
            }}
            className="hover:text-blue-400 transition text-xs"
          >
            Admin
          </a>
        </footer>
      )}

      <WinnerModal
        isOpen={isWinnerModalOpen}
        winnerProject={winnerProject}
        userVotedForWinner={userVotedForWinner}
      />
    </div>
  );
};

export default App;