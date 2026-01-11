# Architectural Decisions

## Non-Negotiables

1. **Per-user Google OAuth**: App can only access what that user can access; Shared Drives must work.
2. **Never mutate originals by default**: Build CLEAN copy first; Promote is explicit; never auto-delete.
3. **Unknown/uncertain routes to Other**: Duplicates are flagged only.
4. **No persistent storage of file contents**: Store only structure metadata, template JSON, and lightweight run logs locally.

## Drive Shared Drive Query Requirements

- Every Drive API call must use:
  - `supportsAllDrives=true`
  - `includeItemsFromAllDrives=true`
- When listing inside Shared Drives:
  - Use `corpora=drive`
  - Use `driveId=<workspace.driveId>`
- Folder listing query pattern: `'<folderId>' in parents and trashed=false`
- Operate on IDs, not names

## Technology Choices

- **Package Manager**: pnpm
- **OAuth**: NextAuth.js with Google provider
- **Database**: SQLite with better-sqlite3
- **Next.js**: Latest stable version
- **Background Jobs**: Single-process event emitter (designed as interface for future queue replacement)

## Planner Output

- JSON-only output
- Strict validation
- Invalid rows route to Other with low confidence
- Keyword router runs first; LLM only for ambiguous cases

## Safety Mechanisms

- Promote: Move original to `__OLD__/Archive`, move CLEAN into place
- Never delete automatically
- Always log actions
- Partial failures continue and surface retry list

