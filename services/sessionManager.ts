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
 * Send email verification code via Brevo (Cloud Function)
 */
export async function sendEmailVerificationLink(email: string, userName: string, isJury: boolean): Promise<AuthResult> {
  try {
    // Import emailService to avoid circular dependencies
    const { sendVerificationEmailViaBrevo } = await import('./emailService');

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return { success: false, message: 'Correo electrónico inválido' };
    }

    if (!userName || userName.trim().length === 0) {
      return { success: false, message: 'El nombre es requerido' };
    }

    // Call Cloud Function to send email via Brevo
    const result = await sendVerificationEmailViaBrevo(email, userName, isJury);

    if (!result.success) {
      return result;
    }

    // Store pending verification data in localStorage (persists across page reloads)
    const pendingAuth = {
      email,
      userName,
      isJury,
      timestamp: Date.now(),
    };
    localStorage.setItem('pluginpitch_pending_auth', JSON.stringify(pendingAuth));

    return {
      success: true,
      message: 'Se envió un link de verificación a tu correo. Por favor revisa tu email.',
    };
  } catch (error: any) {
    console.error('Error sending verification link:', error);

    return {
      success: false,
      message: 'Error al enviar el link de verificación. Por favor intenta de nuevo.',
    };
  }
}

/**
 * Verify email code and complete authentication (uses Brevo code from email link)
 * Called when user opens ?code=xxx&email=yyy from email
 */
export async function verifyEmailCode(code: string, email: string): Promise<AuthResult> {
  try {
    // Import emailService to avoid circular dependencies
    const { verifyEmailCodeViaBrevo } = await import('./emailService');

    if (!code || !email) {
      return { success: false, message: 'Código o email inválido.' };
    }

    // Call Cloud Function to verify code
    const result = await verifyEmailCodeViaBrevo(code, email);

    if (!result.success) {
      return result;
    }

    const { userName, isJury } = result;

    // Create session data
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session

    const sessionData: SessionData = {
      sessionId,
      userEmail: email,
      userName: userName || 'Usuario',
      role: isJury ? 'jury' : 'voter',
      weight: isJury ? 2 : 1,
      createdAt: new Date(),
      expiresAt,
      isJury: isJury || false,
    };

    // Store session in sessionStorage (persists during active browser session)
    sessionStorage.setItem('pluginpitch_session', JSON.stringify(sessionData));

    // Store user data in Firestore for record-keeping
    await setDoc(doc(collection(db, 'users'), sessionId), {
      email,
      name: userName,
      role: isJury ? 'jury' : 'voter',
      isJury,
      createdAt: Timestamp.now(),
      lastVerifiedAt: Timestamp.now(),
    });

    // Clear pending auth data from localStorage
    localStorage.removeItem('pluginpitch_pending_auth');

    return {
      success: true,
      message: '¡Email verificado! Procede a votar.',
      sessionData,
    };
  } catch (error: any) {
    console.error('Error verifying email code:', error);

    return {
      success: false,
      message: 'Error al verificar el código. Por favor intenta de nuevo.',
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
 * Get stored vote info from previous session (cached locally to reduce queries)
 */
export async function getStoredVoteInfo(userEmail: string): Promise<{ projectId: string; isJury: boolean } | null> {
  try {
    // Check local cache first (avoid unnecessary queries)
    const cacheKey = `vote_cache_${userEmail}`;
    const cachedVote = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

    // If cache is recent (within 5 minutes), use it
    if (cachedVote && cacheTime) {
      const cacheAge = Date.now() - parseInt(cacheTime);
      if (cacheAge < 5 * 60 * 1000) {
        const cached = JSON.parse(cachedVote);
        return cached.found ? cached.data : null;
      }
    }

    // Query Firestore only if cache is stale
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const votesQuery = query(
      collection(db, 'votes'),
      where('userEmail', '==', userEmail),
      where('timestamp', '>=', Timestamp.fromDate(today))
    );

    const votes = await getDocs(votesQuery);

    if (votes.empty) {
      // Cache empty result
      sessionStorage.setItem(cacheKey, JSON.stringify({ found: false }));
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      return null;
    }

    const latestVote = votes.docs[0].data();
    const voteInfo = {
      projectId: latestVote.projectId,
      isJury: latestVote.weight === 2,
    };

    // Cache the result
    sessionStorage.setItem(cacheKey, JSON.stringify({ found: true, data: voteInfo }));
    sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

    return voteInfo;
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
