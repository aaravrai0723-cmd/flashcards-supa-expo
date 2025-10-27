# OAuth Setup Checklist

Quick checklist for setting up Google and Apple authentication.

## Google OAuth Setup

### Google Cloud Console
- [ ] Create/select project in [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen (External user type)
- [ ] Add required scopes: `email`, `profile`, `openid`
- [ ] Create OAuth 2.0 Web Application credentials
- [ ] Add authorized redirect URI:
  ```
  https://xzpyvvkqfnurbxqwcyrx.supabase.co/auth/v1/callback
  ```
- [ ] Copy Client ID and Client Secret

### Supabase Dashboard
- [ ] Go to Authentication > Providers
- [ ] Enable Google provider
- [ ] Paste Client ID
- [ ] Paste Client Secret
- [ ] Save changes

### Testing
- [ ] Run app: `npm run dev`
- [ ] Click "Continue with Google"
- [ ] Sign in with Google account
- [ ] Verify redirect back to app
- [ ] Check user appears in Supabase dashboard

---

## Apple Sign In Setup (iOS Only)

### Apple Developer Portal
- [ ] Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/)
- [ ] Find your App ID
- [ ] Enable "Sign In with Apple" capability
- [ ] Create Service ID (e.g., `com.flashcards.app.auth`)
- [ ] Configure Service ID with return URL:
  ```
  https://xzpyvvkqfnurbxqwcyrx.supabase.co/auth/v1/callback
  ```
- [ ] Create Private Key (.p8 file)
- [ ] Download key and note Key ID
- [ ] Note your Team ID (from account settings)

### Supabase Dashboard
- [ ] Go to Authentication > Providers
- [ ] Enable Apple provider
- [ ] Enter Services ID
- [ ] Paste content of .p8 file in Secret Key
- [ ] Enter Key ID
- [ ] Enter Team ID
- [ ] Save changes

### Testing
- [ ] Run app on iOS device/simulator: `npm run ios`
- [ ] Click "Continue with Apple"
- [ ] Sign in with Apple ID
- [ ] Choose email sharing preference
- [ ] Verify redirect back to app
- [ ] Check user appears in Supabase dashboard

---

## Verification

After setup, verify:
- [ ] Users can sign in with Google
- [ ] Users can sign in with Apple (iOS only)
- [ ] Users can sign in with magic link (existing)
- [ ] Auth state persists across app restarts
- [ ] Sign out works correctly
- [ ] User data appears correctly in app
- [ ] Supabase dashboard shows users under Authentication > Users

---

## Common Issues

**Google: "redirect_uri_mismatch"**
- Check redirect URI exactly matches in Google Cloud Console

**Apple: "invalid_client"**
- Verify Service ID, Key ID, and Team ID are correct
- Check .p8 file content is complete

**OAuth window closes immediately**
- Verify `expo-web-browser` is installed
- Check scheme in app.json: `"scheme": "flashcards"`

**No redirect after authentication**
- Check deep link configuration
- Verify `expo-linking` is set up correctly

---

## Need Help?

See the full [OAuth Setup Guide](./OAUTH_SETUP.md) for detailed instructions.
