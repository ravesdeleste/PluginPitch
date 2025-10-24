# Email Verification Setup Guide

## Overview

PluginPitch now uses **Firebase Email Link Authentication** to verify email ownership before voting. This ensures:
- ✅ Email is real and belongs to the user
- ✅ One vote per person per day
- ✅ Simple, no password required
- ✅ Link expires after 1 hour for security

---

## How It Works

### User Flow

1. **Registration Page**
   - User enters: Name, Email, and optional Jury Code
   - Click "Ingresar y Votar"

2. **Email Verification Link Sent**
   - App shows "Verifica tu Email" screen
   - Firebase sends verification link to user's email
   - Link is valid for 1 hour

3. **User Opens Email**
   - User opens email from "Firebase"
   - Clicks "Verificar email" link
   - Redirected to app with verification token

4. **Email Verified**
   - App verifies the token
   - Creates secure session
   - User redirected to voting screen
   - User can now vote

5. **Vote Submitted**
   - User selects project
   - Vote recorded with email verification
   - "Gracias por Votar" screen shown
   - Session expires after 24 hours

---

## Setup Requirements

### Firebase Console Configuration

1. **Enable Email/Password Authentication**
   - Go to: Firebase Console → Your Project → Authentication
   - Click "Sign-in method" tab
   - Enable "Email/Password"
   - Save

2. **Configure Email Settings (Optional but Recommended)**
   - In Authentication → Templates
   - Customize the email template:
     - From email: your-event@example.com
     - Subject: "Verifica tu email para votar en Plugin Pitch"
     - Email body: Add event info, deadline, etc.

3. **Add Authorized Domains**
   - Authentication → Settings → Authorized Domains
   - Add your domain: `yourdomain.com`
   - Add `localhost:3000` for testing

### Environment Variables

Already configured in `.env.local`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=plugin-pitch.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=plugin-pitch
# ... etc
```

No additional setup needed for email verification.

---

## Technical Details

### Files Involved

**New:**
- `components/EmailVerificationScreen.tsx` - UI for pending verification
- `services/sessionManager.ts` - Updated with email link logic

**Modified:**
- `App.tsx` - Added AWAITING_EMAIL_VERIFICATION state
- `RegistrationForm.tsx` - Uses sendEmailVerificationLink()
- `firebase.ts` - Exports auth instance

### Key Functions in sessionManager.ts

#### 1. `sendEmailVerificationLink(email, userName, isJury)`
Sends verification link to user's email

```typescript
const result = await sendEmailVerificationLink('user@example.com', 'Juan', false);
if (result.success) {
  // Email sent, show verification screen
} else {
  // Error: show message
}
```

**Validations:**
- Email format
- Email hasn't voted today
- Rate limiting (Firebase handles)

#### 2. `verifyEmailLink()`
Verifies the link from email and creates session

Called automatically when user opens email link with `?mode=verifyEmail`

```typescript
const result = await verifyEmailLink();
if (result.success) {
  // Email verified, user can vote
  // Session created with 24-hour expiry
}
```

#### 3. Session Management
```typescript
const session = getCurrentSession(); // Get verified user
if (session?.isJury) {
  // User is jury member (weight = 2)
} else {
  // Regular voter (weight = 1)
}
```

---

## User Experience Flow

```
┌─────────────────┐
│   Welcome       │
│   Screen        │
└────────┬────────┘
         │ "Click to Vote"
         ▼
┌──────────────────────────┐
│  Registration Form       │
│  - Name                  │
│  - Email                 │
│  - Jury Code (optional)  │
└────────┬─────────────────┘
         │ "Ingresar y Votar"
         ▼
┌──────────────────────────────────┐
│  Email Verification Screen       │
│  "Check your email for link"     │
│  [Resend Button]                 │
└──────────────────────────────────┘
         │ User opens email link
         ▼
┌────────────────────────┐
│  Voting Screen         │
│  - Project 1           │
│  - Project 2           │
│  - Project 3           │
│  [Vote Button]         │
└────────┬───────────────┘
         │ "Votar"
         ▼
┌──────────────────────┐
│  Thank You Screen    │
│  "Gracias por Votar" │
└──────────────────────┘
         │ 3 second delay
         ▼
┌──────────────────────────┐
│  Voted Confirmation      │
│  Shows: Your Vote Was    │
│  For: [Project Name]     │
└──────────────────────────┘
```

---

## Testing the Flow

### Local Testing

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Use Firebase's Test Email Address:**
   - Go to Firebase Console → Authentication → Users
   - Add test user, or use existing one
   - The app will allow verification

3. **Testing Email Link Locally:**
   - In Firebase Console → Authentication → Templates
   - View example of email link format
   - Manually construct the link:
   ```
   http://localhost:3000?mode=verifyEmail&email=test@example.com&oobCode=VERIFICATION_CODE
   ```

### Production Testing

1. **Use Real Email Address**
   - Enter your email in registration form
   - Check spam folder
   - Click link from Firebase

2. **Check Verification Status**
   - Open Browser DevTools → Application
   - sessionStorage → pluginpitch_session
   - Verify user data is there

---

## Troubleshooting

### Email Not Received

**Possible causes:**
1. Email domain not added to Firebase authorized domains
   - Fix: Authentication → Settings → Authorized Domains → Add your domain

2. Spam folder
   - Tell users to check spam
   - Customize email template in Firebase for better delivery

3. Rate limiting
   - Firebase limits emails to 1 per minute per email
   - Show error: "Demasiados intentos. Intenta más tarde."

### Link Expired

**Links expire after 1 hour**
- Solution: User clicks "Resend" button
- New link is sent immediately

### Verification Fails with "Invalid Code"

**Possible causes:**
1. Link was used already (Firebase auto-revokes)
   - Solution: User clicks "Resend" to get new link

2. Different browser/device than expected
   - Firebase stores device info
   - If switching browsers, may fail
   - Solution: Click "Resend" to get new link

3. Too much time elapsed
   - Link valid for 1 hour
   - Solution: Click "Resend"

---

## Security Features

### Email Verification Ensures:

1. **Email Ownership Verified**
   - Only owner of email can click link
   - Link is one-time use only

2. **One Vote Per Email Per Day**
   - Session created only after email verification
   - Vote recorded with email
   - Cannot vote twice same day with same email

3. **Session Expiration**
   - Session expires after 24 hours
   - User must re-verify email next day

4. **Link Expiration**
   - Verification links expire after 1 hour
   - Prevents old links being reused

5. **Rate Limiting**
   - Firebase limits to 1 email per minute per address
   - Prevents spam/abuse

---

## Firebase Email Authentication Limits

Firebase allows:
- ✅ 50,000 email verifications per day (free tier)
- ✅ 1 verification per minute per email
- ✅ 1 hour link expiration
- ✅ Customizable email templates

For larger events:
- Contact Firebase for increased limits
- Upgrade to Blaze plan if needed

---

## Advanced Configuration

### Custom Email Template (Optional)

In Firebase Console:
1. Authentication → Templates → Confirm email address
2. Edit template:

```html
<h2>Verifica tu Email</h2>
<p>Haz clic en el botón para verificar tu email y votar:</p>
<a href="%LINK%">
  <button>Verificar Email</button>
</a>
<p>Este link expira en 1 hora.</p>
<p>Evento: PluginPitch 2024</p>
```

Variables available:
- `%LINK%` - Verification link
- `%EMAIL%` - User's email
- `%DISPLAY_NAME%` - User's display name

### Handling Email Delivery Failures

If emails fail to send, check:
1. Firebase authentication is enabled
2. Email/password provider is active
3. Authorized domains include your domain
4. Email address is valid format
5. Not rate limited

---

## Next Steps

1. ✅ Configure Firebase Email/Password in console
2. ✅ (Optional) Customize email template
3. ✅ Add authorized domains
4. ✅ Test full flow with real email
5. ✅ Deploy to production

For questions, see `SECURITY_CHANGES.md` for overall security architecture.
