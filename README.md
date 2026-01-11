# Prospeq File Management

A local-first web application for organizing Google Shared Drive files using AI-powered routing and templated folder structures.

## Features

- **Google OAuth Integration**: Per-user authentication with Google Drive access
- **Shared Drive Support**: Works with Google Shared Drives (not just My Drive)
- **AI-Powered Routing**: Keyword-based routing with LLM fallback for ambiguous cases
- **Template System**: Define and manage folder templates with expected items
- **Clean Copy Workflow**: Scan → Plan → Review → Build CLEAN copy → Promote
- **Missing Items Report**: Generate reports of expected items not found in folders
- **Duplicate Detection**: Flags duplicate files (never auto-deletes)
- **Safety First**: Never mutates originals until explicit "Promote" action

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Google Cloud Project with OAuth credentials
- OpenAI API key (for LLM-based routing)

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Create a `.env` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here-generate-with-openssl-rand-base64-32

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI API Key (for LLM-based file routing)
OPENAI_API_KEY=sk-proj-...

# Database
DATABASE_PATH=./data/database.sqlite

# Logging
LOG_LEVEL=info
```

3. Generate a NextAuth secret:

```bash
openssl rand -base64 32
```

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env`

5. Run the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Configuration

### OpenAI API Key

The application uses OpenAI's API for LLM-based file routing when keyword matching is insufficient. Add your API key to the `.env` file:

```env
OPENAI_API_KEY=sk-proj-...your-api-key-here
```

If the API key is not configured, the LLM router will default to routing files to the "Other" folder.

## Workflows

### Clean Up Flow

1. **Select Company Folder**: Pick a folder containing unorganized files
2. **Scan**: Read-only scan to build inventory (folders, files, metadata)
3. **Plan**: AI generates routing plan (keyword → LLM → Other)
4. **Review**: Approve, override, or exclude routing decisions
5. **Build CLEAN Copy**: Create `CompanyName__CLEAN__YYYY-MM-DD` with templated structure
6. **Review Result**: Check the CLEAN folder before promoting
7. **Promote**: Archive original as `CompanyName__OLD__YYYY-MM-DD` and swap CLEAN into place

### Ingest Flow

1. Select inbox folder (upload files or choose existing)
2. Choose destination (New Company or Existing Company)
3. Generate routing plan
4. Review and approve
5. Copy files to target locations

### Template Editor

- Create and manage multiple templates
- Edit folder tree structure (add/rename/reorder/nest)
- Configure expected items with priorities and detection rules
- Publish template versions

## Safety Features

- **Never mutates originals** by default - all operations work on copies
- **Explicit Promote action** required to replace originals
- **Reversible promotion** - original is archived, can be swapped back
- **No automatic deletion** - duplicates are flagged only
- **Comprehensive logging** - all actions are logged for audit

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite (better-sqlite3)
- **Authentication**: NextAuth.js with Google OAuth
- **Drive Integration**: Google Drive API v3
- **AI Routing**: OpenAI API (GPT-4o-mini)
- **Job Queue**: Single-process EventEmitter-based runner

## Project Structure

```
/app                    # Next.js pages and API routes
/components             # React components
  /ui                  # Reusable UI components
  /dashboard           # Dashboard-specific components
  /plan                # Plan review components
  /template            # Template editor components
  /cleanup             # Clean up workflow components
/lib
  /db                  # Database schema and operations
  /drive               # Google Drive integration
  /planner             # AI routing logic (keyword + LLM)
  /template            # Template management
  /jobs                # Background job runner
  /utils               # Utilities (errors, logging)
/docs                  # Project documentation
/data                  # Local database and logs (gitignored)
```

## Development

### Run locally

```bash
pnpm dev
```

### Type checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Deployment

The application is designed to be deployed to Vercel later. For now, it runs locally with SQLite storage.

**Note**: Long-running jobs (SCAN, COPY, PROMOTE) will need to be moved to a separate worker service or redesigned as chunked tasks when deploying to Vercel, as serverless functions have execution time limits.

## License

Private project - All rights reserved
