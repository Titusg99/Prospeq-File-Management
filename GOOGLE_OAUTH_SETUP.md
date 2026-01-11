# Google OAuth Setup Guide

## Step 1: Generate NextAuth Secret (DONE ✓)

Your NextAuth secret has been generated:
```
Sw5CCp8Hs2ei0Fjf9cadZfhVmtoVdev1vaVEKedT8NA=
```

Add this to your `.env` file as:
```
NEXTAUTH_SECRET=Sw5CCp8Hs2ei0Fjf9cadZfhVmtoVdev1vaVEKedT8NA=
```

---

## Step 2: Get Google OAuth Credentials

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- If you don't have a project: Click "Create Project"
  - Give it a name (e.g., "Prospeq File Management")
  - Click "Create"
- If you have a project: Select it from the project dropdown at the top

### 3. Enable Google Drive API
- In the left sidebar, go to **"APIs & Services"** → **"Library"**
- Search for **"Google Drive API"**
- Click on it and press **"Enable"**
- Wait for it to enable (should take a few seconds)

### 4. Create OAuth 2.0 Credentials
- In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
- Click **"+ CREATE CREDENTIALS"** at the top
- Select **"OAuth client ID"**

### 5. Configure OAuth Consent Screen (if prompted)
If this is your first time:
- Choose **"External"** user type (unless you have a Google Workspace)
- Click **"Create"**
- Fill in the required fields:
  - **App name**: "Prospeq File Management" (or any name)
  - **User support email**: Your email
  - **Developer contact email**: Your email
- Click **"Save and Continue"**
- On "Scopes" page, click **"Save and Continue"** (we'll add scopes in the credentials)
- On "Test users" page, add your email as a test user (or skip for now)
- Click **"Save and Continue"**
- Click **"Back to Dashboard"**

### 6. Create OAuth Client ID
- **Application type**: Select **"Web application"**
- **Name**: Give it a name like "Prospeq Web Client"
- **Authorized JavaScript origins**: Click "Add URI" and add:
  ```
  http://localhost:3000
  ```
- **Authorized redirect URIs**: Click "Add URI" and add:
  ```
  http://localhost:3000/api/auth/callback/google
  ```
- Click **"Create"**

### 7. Copy Your Credentials
You'll see a popup with:
- **Your Client ID** (looks like: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`)
- **Your Client Secret** (looks like: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`)

**⚠️ IMPORTANT**: Copy these NOW - you won't be able to see the secret again!

---

## Step 3: Create Your .env File

Create a file named `.env` in the root of your project with:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=Sw5CCp8Hs2ei0Fjf9cadZfhVmtoVdev1vaVEKedT8NA=

# Google OAuth (paste your credentials from Step 7)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# OpenAI API Key (optional - for AI routing)
OPENAI_API_KEY=your-openai-key-here

# Database
DATABASE_PATH=./data/database.sqlite

# Logging
LOG_LEVEL=info
```

Replace:
- `your-client-id-here.apps.googleusercontent.com` with your actual Client ID
- `your-client-secret-here` with your actual Client Secret

---

## Step 4: Verify Everything Works

1. Make sure your `.env` file is saved
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 in your browser
4. Try to sign in with Google
5. You should be redirected to Google's login page

---

## Troubleshooting

### "Client ID not found"
- Make sure you copied the entire Client ID including `.apps.googleusercontent.com`
- Check for extra spaces in your `.env` file

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- No trailing slashes!

### "Access blocked: This app's request is invalid"
- Make sure you added yourself as a test user in the OAuth consent screen
- The app is in "Testing" mode, so only test users can sign in

### Can't see the Client Secret again?
- You'll need to create a new OAuth client ID
- Or go to the credentials page → click on your OAuth client → "Reset Secret"

---

## Quick Reference Links

- Google Cloud Console: https://console.cloud.google.com/
- Google Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com
- OAuth Credentials: https://console.cloud.google.com/apis/credentials
