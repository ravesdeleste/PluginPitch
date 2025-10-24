/**
 * Session Manager - Email Link Authentication for voters
 *
 * This module provides secure email-based authentication for:
 * - Regular voters (simple vote weight)
 * - Jury members (double vote weight)
 * - Admin access (full privileges)
 *
 * Uses Firebase Authentication Email Link Sign-in for verification.
 */

import { auth, db } from './firebase';
import {
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  isSignInWithEmailLink
} from 'firebase/auth';
import { collection, doc, setDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Session types
export type UserRole = 'voter' | 'jury' | 'admin';

export interface SessionData {
  sessionId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  weight: number; // 1 for voter, 2 for jury
  createdAt: Date;
  expiresAt: Date;
  isJury: boolean;
}

export interface AuthResult {
  success: boolean;
  message: string;
  sessionData?: SessionData;
}

/**
 * Send email verification link to user
 */
export async function sendEmailVerificationLink(email: string, userName: string, isJury: boolean): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return { success: false, message: 'Correo electrónico inválido' };
    }

    if (!userName || userName.trim().length === 0) {
      return { success: false, message: 'El nombre es requerido' };
    }

    // Check if user has already voted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const votesQuery = query(
      collection(db, 'votes'),
      where('userEmail', '==', email),
      where('timestamp', '>=', Timestamp.fromDate(today))
    );

    const existingVotes = await getDocs(votesQuery);
    if (!existingVotes.empty) {
      return {
        success: false,
        message: 'Ya has votado hoy. Puedes votar nuevamente mañana.',
      };
    }

    // Store pending verification data in sessionStorage
    const pendingAuth = {
      email,
      userName,
      isJury,
      timestamp: Date.now(),
    };
    sessionStorage.setItem('pluginpitch_pending_auth', JSON.stringify(pendingAuth));

    // Configure email link settings
    const actionCodeSettings = {
      url: `${window.location.origin}?mode=verifyEmail&email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };

    // Send verification link
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    return {
      success: true,
      message: 'Se envió un link de verificación a tu correo. Por favor revisa tu email.',
    };
  } catch (error: any) {
    console.error('Error sending verification link:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Correo electrónico inválido' };
    }
    if (error.code === 'auth/too-many-requests') {
      return { success: false, message: 'Demasiados intentos. Por favor intenta más tarde.' };
    }

    return {
      success: false,
      message: 'Error al enviar el link de verificación. Por favor intenta de nuevo.',
    };
  }
}

/**
 * Verify email link and complete authentication
 */
export async function verifyEmailLink(): Promise<AuthResult> {
  try {
    // Check if the URL contains the verification link
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return { success: false, message: 'Link de verificación inválido o expirado.' };
    }

    // Get pending auth data
    const pendingAuthStr = sessionStorage.getItem('pluginpitch_pending_auth');
    if (!pendingAuthStr) {
      return { success: false, message: 'Error: datos de verificación no encontrados.' };
    }

    const pendingAuth = JSON.parse(pendingAuthStr);
    const { email, userName, isJury } = pendingAuth;

    // Sign in with the email link
    const result = await signInWithEmailLink(auth, email, window.location.href);
    const user = result.user;

    // Create session data
    const sessionId = user.uid;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session

    const sessionData: SessionData = {
      sessionId,
      userEmail: email,
      userName,
      role: isJury ? 'jury' : 'voter',
      weight: isJury ? 2 : 1,
      createdAt: new Date(),
      expiresAt,
      isJury,
    };

    // Store session in sessionStorage
    sessionStorage.setItem('pluginpitch_session', JSON.stringify(sessionData));

    // Store user data in Firestore for record-keeping
    await setDoc(doc(collection(db, 'users'), user.uid), {
      email: user.email,
      name: userName,
      role: isJury ? 'jury' : 'voter',
      isJury,
      createdAt: Timestamp.now(),
      lastVerifiedAt: Timestamp.now(),
    });

    // Clear pending auth data
    sessionStorage.removeItem('pluginpitch_pending_auth');

    return {
      success: true,
      message: '¡Email verificado! Procede a votar.',
      sessionData,
    };
  } catch (error: any) {
    console.error('Error verifying email link:', error);

    if (error.code === 'auth/expired-action-code') {
      return { success: false, message: 'El link de verificación ha expirado. Por favor intenta de nuevo.' };
    }
    if (error.code === 'auth/invalid-action-code') {
      return { success: false, message: 'Link de verificación inválido. Por favor intenta de nuevo.' };
    }

    return {
      success: false,
      message: 'Error al verificar el email. Por favor intenta de nuevo.',
    };
  }
}

/**
 * Validate admin credentials and create admin session
 */
export async function validateAdminCredentials(adminKey: string): Promise<AuthResult> {
  try {
    const expectedAdminKey = import.meta.env.VITE_ADMIN_KEY;

    if (!expectedAdminKey || adminKey !== expectedAdminKey) {
      return {
        success: false,
        message: 'Clave de administrador incorrecta',
      };
    }

    // Create admin session
    const sessionId = `admin_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8-hour admin session

    const sessionData: SessionData = {
      sessionId,
      userEmail: 'admin@pluginpitch.local',
      userName: 'Administrador',
      role: 'admin',
      weight: 1,
      createdAt: new Date(),
      expiresAt,
      isJury: false,
    };

    // Store in sessionStorage
    sessionStorage.setItem('pluginpitch_admin_session', JSON.stringify(sessionData));

    return {
      success: true,
      message: 'Acceso de administrador granted',
      sessionData,
    };
  } catch (error) {
    console.error('Error validating admin:', error);
    return {
      success: false,
      message: 'Error al validar credenciales',
    };
  }
}

/**
 * Get current session from sessionStorage
 */
export function getCurrentSession(): SessionData | null {
  try {
    const session = sessionStorage.getItem('pluginpitch_session');
    if (!session) return null;

    const sessionData: SessionData = JSON.parse(session);

    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      clearSession();
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get current admin session
 */
export function getCurrentAdminSession(): SessionData | null {
  try {
    const session = sessionStorage.getItem('pluginpitch_admin_session');
    if (!session) return null;

    const sessionData: SessionData = JSON.parse(session);

    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      clearAdminSession();
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Clear voter session
 */
export async function clearSession(): Promise<void> {
  sessionStorage.removeItem('pluginpitch_session');
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

/**
 * Clear admin session
 */
export function clearAdminSession(): void {
  sessionStorage.removeItem('pluginpitch_admin_session');
}

/**
 * Clear all sessions (logout)
 */
export async function clearAllSessions(): Promise<void> {
  await clearSession();
  clearAdminSession();
}

/**
 * Verify if user has active session
 */
export function hasActiveSession(): boolean {
  return getCurrentSession() !== null;
}

/**
 * Verify if admin has active session
 */
export function hasActiveAdminSession(): boolean {
  return getCurrentAdminSession() !== null;
}

/**
 * Get stored vote info from previous session
 */
export async function getStoredVoteInfo(userEmail: string): Promise<{ projectId: string; isJury: boolean } | null> {
  try {
    // Query for latest vote by this user today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const votesQuery = query(
      collection(db, 'votes'),
      where('userEmail', '==', userEmail),
      where('timestamp', '>=', Timestamp.fromDate(today))
    );

    const votes = await getDocs(votesQuery);

    if (votes.empty) return null;

    const latestVote = votes.docs[0].data();
    return {
      projectId: latestVote.projectId,
      isJury: latestVote.weight === 2,
    };
  } catch (error) {
    console.error('Error getting stored vote info:', error);
    return null;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
