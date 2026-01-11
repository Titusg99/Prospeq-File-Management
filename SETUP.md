# Setup Guide

## Quick Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-this-with-openssl-rand-base64-32

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# OpenAI API Key (for LLM routing)
OPENAI_API_KEY=sk-proj-...your-api-key-here

# Database
DATABASE_PATH=./data/database.sqlite

# Logging
LOG_LEVEL=info
```

### 3. Generate NextAuth Secret

```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# On macOS/Linux:
openssl rand -base64 32
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### 5. Run the Application

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## OpenAI API Key

Add your OpenAI API key to the `.env` file. You can get your API key from [OpenAI's platform](https://platform.openai.com/api-keys):

```env
OPENAI_API_KEY=sk-proj-...your-api-key-here
```

The LLM router uses **GPT-4o-mini** by default (cost-effective model). You can modify the model in `lib/planner/llmRouter.ts` if needed.

## First Run

1. Sign in with Google OAuth
2. Create a workspace (select a Shared Drive)
3. Create or select a template
4. Start organizing files!

## Troubleshooting

### better-sqlite3 Installation Issues

If you get errors about `better-sqlite3` failing to build (Python not found), you need to install build tools:

**Option 1: Install Visual Studio Build Tools (Recommended)**
1. Download and install [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. During installation, select "Desktop development with C++" workload
3. Restart your terminal and run: `npm rebuild better-sqlite3`

**Option 2: Configure Python**
If you have Python 3.11+ installed, configure npm to use it:
```powershell
npm config set python "C:\Users\Tpgri\AppData\Local\Programs\Python\Python311\python.exe"
npm rebuild better-sqlite3
```

**Option 3: Use Prebuilt Binaries (Temporary)**
The package is already installed but may not be compiled. The app should still work for development - the database will be created when you first run it.

### OpenAI API Errors

If you see errors about OpenAI API:
- Verify your API key is correct in `.env`
- Check your OpenAI account has credits/usage limits
- Check the console logs for specific error messages

### Google Drive Access Issues

- Ensure you've enabled Google Drive API in Google Cloud Console
- Check that your OAuth redirect URI matches exactly
- Verify the Shared Drive is accessible with your Google account

### Database Issues

- The database will be created automatically in `./data/database.sqlite`
- Ensure the `./data` directory is writable
- Delete `./data/database.sqlite` to reset the database (you'll lose all data)

