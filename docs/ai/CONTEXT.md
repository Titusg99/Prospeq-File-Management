# Context

## Current State

The project has been scaffolded and is in active development. Core features including authentication, database schema, Google Drive integration, AI routing, template system, and UI components have been implemented.

## Project Status

- ✅ Authentication: NextAuth.js with Google OAuth implemented
- ✅ Database: SQLite schema and migrations in place
- ✅ Google Drive Integration: Shared Drive support with listing, copying, and promotion
- ✅ AI Routing: Keyword router and LLM fallback implemented
- ✅ Template System: Template CRUD, folder tree editor, expected items
- ✅ Workflows: Clean Up flow (scan → plan → review → build → promote), Ingest flow, Missing Reports
- ✅ UI: Dashboard, templates, runs, cleanup, and settings pages

## Key Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run linter
- `pnpm type-check` - TypeScript type checking

## Known Constraints

- **Local-first**: All data stored locally (SQLite)
- **No file content storage**: Only metadata, structure, templates, and logs stored locally
- **Per-user OAuth**: Each user authenticates independently
- **Shared Drive support**: Must work with Google Shared Drives
- **Never mutate originals**: Only create CLEAN copies

