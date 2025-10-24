/**
 * Email Service - Uses Firebase Cloud Functions with Brevo
 *
 * Handles:
 * - Sending verification emails via Cloud Function
 * - Verifying email codes from Cloud Function
 */

import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Send verification email via Cloud Function (uses Brevo to send)
 */
export async function sendVerificationEmailViaBrevo(
  email: string,
  userName: string,
  isJury: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the Cloud Function
    const sendEmailFunction = httpsCallable(functions, 'sendVerificationEmail');

    // Call the function
    const result = await sendEmailFunction({
      email,
      userName,
      isJury,
    });

    const data = result.data as { success: boolean; message: string };
    return data;
  } catch (error: any) {
    console.error('Error calling sendVerificationEmail function:', error);

    // Handle specific error codes
    if (error.code === 'invalid-argument') {
      return {
        success: false,
        message: error.message || 'Email o datos inválidos',
      };
    }

    if (error.code === 'already-exists') {
      return {
        success: false,
        message: error.message || 'Ya has votado hoy',
      };
    }

    if (error.code === 'internal') {
      return {
        success: false,
        message: 'Error al enviar el email. Por favor intenta más tarde.',
      };
    }

    return {
      success: false,
      message: 'Error desconocido. Por favor intenta de nuevo.',
    };
  }
}

/**
 * Verify email code via Cloud Function
 */
export async function verifyEmailCodeViaBrevo(
  code: string,
  email: string
): Promise<{
  success: boolean;
  message: string;
  userName?: string;
  isJury?: boolean;
}> {
  try {
    // Get the Cloud Function
    const verifyFunction = httpsCallable(functions, 'verifyEmailCode');

    // Call the function
    const result = await verifyFunction({
      code,
      email,
    });

    const data = result.data as {
      success: boolean;
      userName: string;
      isJury: boolean;
    };

    return {
      success: true,
      message: 'Email verificado exitosamente',
      userName: data.userName,
      isJury: data.isJury,
    };
  } catch (error: any) {
    console.error('Error calling verifyEmailCode function:', error);

    // Handle specific error codes
    if (error.code === 'not-found') {
      return {
        success: false,
        message: 'Código inválido o expirado. Por favor solicita uno nuevo.',
      };
    }

    if (error.code === 'deadline-exceeded') {
      return {
        success: false,
        message: 'El código ha expirado. Por favor solicita uno nuevo.',
      };
    }

    if (error.code === 'permission-denied') {
      return {
        success: false,
        message: 'Email no coincide. Por favor verifica los datos.',
      };
    }

    return {
      success: false,
      message: 'Error al verificar el código. Por favor intenta de nuevo.',
    };
  }
}
