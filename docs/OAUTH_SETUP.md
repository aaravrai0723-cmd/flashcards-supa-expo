# OAuth Authentication Setup Guide

This guide walks you through setting up Google and Apple authentication for your Flashcards app using Supabase.

## Overview

The mobile app supports three authentication methods:
1. **Magic Link** (Email) - Already configured
2. **Google OAuth** - Requires setup
3. **Apple Sign In** - Requires setup (iOS only)

## Prerequisites

- Supabase project (already set up)
- Google Cloud Console account (for Google OAuth)
- Apple Developer account (for Apple Sign In, iOS only)
- Your app's redirect URLs

## Getting Your Redirect URLs

Your Supabase redirect URL pattern:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

For your project:
```
https://xzpyvvkqfnurbxqwcyrx.supabase.co/auth/v1/callback
```

---

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** for your project

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in the required information:
   - **App name**: Flashcards App
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
5. Save and continue

### Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application** as the application type
4. Add **Authorized redirect URIs**:
   ```
   https://xzpyvvkqfnurbxqwcyrx.supabase.co/auth/v1/callback
   ```
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### Step 4: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Find **Google** and enable it
5. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
6. Save changes

### Step 5: (Optional) Create iOS and Android Clients

For better native app experience:

#### iOS Client
1. In Google Cloud Console, create another OAuth client
2. Select **iOS** as application type
3. Enter your iOS bundle ID (from `app.json`)
4. Add this client ID to your Supabase Google provider settings

#### Android Client
1. In Google Cloud Console, create another OAuth client
2. Select **Android** as application type
3. Enter your package name and SHA-1 certificate fingerprint
4. Add this client ID to your Supabase Google provider settings

---

## 2. Apple Sign In Setup

### Step 1: Configure Apple Developer Account

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Identifiers** and find your App ID

### Step 2: Enable Sign In with Apple

1. Select your App ID
2. Scroll to **Sign In with Apple** capability
3. Enable it and configure:
   - Check **Enable as a primary App ID**
4. Save changes

### Step 3: Create Service ID

1. In **Identifiers**, click the **+** button
2. Select **Services IDs** and continue
3. Fill in:
   - **Description**: Flashcards Auth
   - **Identifier**: `com.yourapp.flashcards.auth` (unique identifier)
4. Enable **Sign In with Apple**
5. Click **Configure** next to Sign In with Apple
6. Set **Primary App ID** to your main app ID
7. Add **Return URLs**:
   ```
   https://xzpyvvkqfnurbxqwcyrx.supabase.co/auth/v1/callback
   ```
8. Save and continue

### Step 4: Create Private Key

1. In **Certificates, Identifiers & Profiles**, go to **Keys**
2. Click the **+** button
3. Enter a key name (e.g., "Flashcards Apple Auth Key")
4. Enable **Sign In with Apple**
5. Click **Configure** and select your Primary App ID
6. Save and download the key file (`.p8`)
7. **Important**: Note down the **Key ID** (shown after creation)

### Step 5: Get Your Team ID

1. In the top-right corner of Apple Developer portal
2. Click on your account
3. Note down your **Team ID** (10-character string)

### Step 6: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Find **Apple** and enable it
4. Enter the following:
   - **Services ID**: Your Service ID from Step 3
   - **Secret Key (p8 file)**: Content of the downloaded `.p8` file
   - **Key ID**: From Step 4
   - **Team ID**: From Step 5
5. Save changes

---

## 3. Configure Expo App

### Update app.json (if needed)

Add the following to your `apps/mobile/app.json`:

```json
{
  "expo": {
    "scheme": "flashcards",
    "ios": {
      "bundleIdentifier": "com.yourcompany.flashcards",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.yourcompany.flashcards"
    }
  }
}
```

### Environment Variables

Your `.env.local` already has the Supabase credentials configured. No additional environment variables are needed for OAuth.

---

## 4. Testing Authentication

### Testing Google OAuth

1. Run your app: `npm run dev`
2. Open on iOS or Android device/simulator
3. Click **"Continue with Google"**
4. You should see Google's OAuth consent screen
5. Sign in with your Google account
6. You'll be redirected back to the app and authenticated

### Testing Apple Sign In (iOS Only)

1. Run your app on iOS: `npm run ios`
2. Click **"Continue with Apple"**
3. You should see Apple's authentication screen
4. Sign in with your Apple ID
5. Choose whether to share your email
6. You'll be redirected back to the app and authenticated

### Troubleshooting

**Google OAuth Error: "redirect_uri_mismatch"**
- Verify the redirect URI in Google Cloud Console matches exactly:
  ```
  https://xzpyvvkqfnurbxqwcyrx.supabase.co/auth/v1/callback
  ```

**Apple Sign In Error: "invalid_client"**
- Double-check your Service ID, Key ID, and Team ID in Supabase
- Ensure the `.p8` key file content is correct
- Verify the return URL matches exactly

**OAuth Window Closes Immediately**
- Check Expo's WebBrowser configuration
- Ensure `expo-web-browser` is installed and configured
- Check the deep linking scheme in `app.json`

**No Redirect After Authentication**
- Verify your deep link scheme in `app.json`
- Check that `expo-linking` is properly configured
- Look at the auth state change listener in `useAuth` hook

---

## 5. Security Considerations

### Production Checklist

- [ ] Use HTTPS for all redirect URLs
- [ ] Keep OAuth secrets secure (never commit to git)
- [ ] Set up proper OAuth scopes (minimal required permissions)
- [ ] Configure OAuth consent screen properly
- [ ] Test on both iOS and Android devices
- [ ] Set up email verification flow
- [ ] Configure session timeout appropriately
- [ ] Add rate limiting for authentication attempts
- [ ] Monitor authentication logs in Supabase dashboard

### OAuth Scopes

**Google:**
- `email` - User's email address
- `profile` - User's basic profile info
- `openid` - OpenID Connect

**Apple:**
- Apple Sign In automatically includes email and name (if user consents)

---

## 6. User Data Handling

After successful OAuth authentication, Supabase automatically:

1. Creates a user record in `auth.users` table
2. Stores OAuth provider data in `auth.identities` table
3. Generates a JWT token for the session
4. Triggers the `onAuthStateChange` listener in your app

User metadata available:
- Email address
- Full name (if provided by OAuth provider)
- Avatar URL (from Google)
- Provider ID (google or apple)

You can access this in your app via:
```typescript
const { user } = useAuth();
console.log(user?.email);
console.log(user?.user_metadata);
```

---

## 7. Next Steps

Once OAuth is set up:

1. **Test thoroughly** on all platforms (iOS, Android, web if applicable)
2. **Add user profile** screen to display OAuth profile information
3. **Link multiple providers** - Allow users to link Google and Apple to same account
4. **Set up email verification** for magic link users
5. **Add sign-out functionality** - Already implemented in `useAuth` hook
6. **Configure session persistence** - Already handled by Supabase client
7. **Add account deletion** flow if required by app store policies

---

## Support

If you encounter issues:

1. Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. Review [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
3. Check Google Cloud Console logs
4. Check Supabase Dashboard logs under **Authentication > Logs**

---

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple Sign In Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Expo Web Browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Linking](https://docs.expo.dev/versions/latest/sdk/linking/)
