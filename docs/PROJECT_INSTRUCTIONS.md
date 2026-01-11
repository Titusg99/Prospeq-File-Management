# Drive Organizer + Template Editor + Missing-Items Report

## Goal

Connect to a Google Shared Drive, scan a company folder, create an AI routing plan (filename-only), build a CLEAN templated copy, and optionally Promote (archive original + swap).

## Shared Drive Listing

Drive API v3 with `supportsAllDrives=true` and `includeItemsFromAllDrives=true`. Use `corpora=drive` and `driveId=<workspace.driveId>` when listing inside Shared Drives. Query: `'<folderId>' in parents and trashed=false`. Folder mimeType: `application/vnd.google-apps.folder`.

## Core Flows to Ship

1. **Workspace selection**: Connect to Google Drive, select workspace/folder
2. **Clean Up**: scan → plan → review → build CLEAN → review → promote
3. **Ingest**: inbox → plan → review → copy
4. **Dashboard**: compliance + missing report + duplicates

## Data Model (local)

- **Workspace**: Connected Google Drive account/folder
- **Template**: folderTree + routingRules + expectedItems
- **Run**: Execution instance (SCAN, PLAN, COPY, PROMOTE)
- **PlanItem**: Routing decision for a file
- **DuplicateFlag**: Detected duplicate files
- **LogEvent**: Execution logs and events

## Planner Strategy

- Deterministic keyword router first
- LLM only for unresolved/ambiguous cases
- Strict JSON validation
- Fallback to Other

## Missing Report

For each ExpectedItem:
- Search scope (folderOnly/subtree)
- Evidence (keywords + mimeTypes + optional recencyDays)
- Output missing split by priority

## Safety

- Promote is reversible by swapping archived/original names
- No automatic deletion
- Never mutate originals by default: build CLEAN copy first
- Promote is explicit; never auto-delete

