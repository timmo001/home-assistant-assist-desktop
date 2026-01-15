# Agent Instructions - Home Assistant Assist Desktop

## Project Overview

This is a monorepo for Home Assistant Assist Desktop with two versions:
- **v1/**: Production Svelte + Tauri 1 app (Yarn-based)
- **v2/**: Active development - Lit + Tauri 2 + Bun monorepo (Phase 2 complete)

Focus development on **v2** unless explicitly working on v1 maintenance.

## Build, Test, and Lint Commands

### V2 (Primary Development)

```bash
# Development (run from v2/)
bun run backend          # Start backend server on :3000
bun run web             # Start web UI on :5173 (proxies /api to :3000)
bun run desktop         # Desktop app (Phase 3 - not yet implemented)

# Build
bun run build           # Build all packages
bun run build:types     # Build shared types only
bun run build:backend   # Build backend only
bun run build:web       # Build web UI only
bun run build:desktop   # Build desktop app

# Type Checking
bun run typecheck       # Type check all packages
cd packages/backend && bun run typecheck
cd packages/web && bun run typecheck
cd packages/desktop && bun run typecheck

# Testing
./test-phase2.sh        # Automated backend API testing
# No unit test framework configured - see TESTING-GUIDE.md for manual tests
```

### V1 (Production Maintenance)

```bash
# Development (run from v1/)
bun run dev             # Start Vite dev server
bun run build           # Build production bundle
bun run check           # Type check Svelte components
bun run tauri dev       # Run desktop app in dev mode
bun run tauri build     # Build production app
```

### Package-Level Commands

```bash
# Backend CLI (from packages/backend/)
bun run src/index.ts backend [--port 3000]      # Start server
bun run src/index.ts web [--port 3000]          # Start server + serve web UI
bun run src/index.ts dev [--port 3000]          # Dev mode with HMR
bun run src/index.ts backend --reset-password   # Reset server password
```

## Code Style Guidelines

### General Principles

**IMPORTANT**: When gathering requirements or asking questions, always use the `question` tool instead of plain text. This provides structured, organized choices and improves user experience.

```typescript
// Use the question tool for multiple related questions
question({
  questions: [
    {
      question: "Which component pattern should we use?",
      header: "Pattern",
      options: [
        {label: "Lit", description: "Web components with Lit"},
        {label: "Svelte", description: "Svelte framework"}
      ]
    }
  ]
})
```

### File and Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `assist-chat.ts`, `app-root.ts`)
- **Components**: PascalCase classes, kebab-case custom elements
- **Variables/Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: PascalCase (e.g., `ApiResponse`, `MessageType`)

### Import Style

```typescript
// ES modules with .js extensions in imports (TypeScript requirement)
import { foo } from './utils.js';
import type { ApiResponse } from '@ha-assist/shared-types';

// Group imports: external → workspace → relative
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Settings } from '@ha-assist/shared-types';
import { formatDate } from './utils.js';

// Use workspace protocol in package.json
"@ha-assist/shared-types": "workspace:*"
```

### TypeScript Standards

```typescript
// Use strict mode (already enabled in tsconfig.json)
// Always add explicit return types for public functions
export function processMessage(msg: string): ApiResponse {
  // ...
}

// Use type imports when importing only types
import type { Pipeline, Settings } from '@ha-assist/shared-types';

// Prefer interfaces for object shapes, types for unions/intersections
interface UserSettings {
  theme: 'light' | 'dark';
}

type MessageType = 'user' | 'assistant' | 'error';

// Use const assertions for literal types
const ROUTES = {
  HOME: '/',
  SETTINGS: '/settings',
} as const;
```

### Lit Component Patterns (v2/packages/web)

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  // Public reactive properties
  @property({ type: String }) title = '';
  
  // Private reactive state
  @state() private isLoading = false;
  
  // Static styles (use css tagged template)
  static styles = css`
    :host {
      display: block;
    }
  `;
  
  // Lifecycle: connectedCallback, disconnectedCallback, etc.
  connectedCallback() {
    super.connectedCallback();
    // Setup
  }
  
  // Render method returns TemplateResult
  render() {
    return html`
      <div class="container">
        <h1>${this.title}</h1>
      </div>
    `;
  }
}
```

### Error Handling

```typescript
// Backend: Return structured JSON errors
try {
  const result = await fetchData();
  return c.json({ success: true, data: result });
} catch (error) {
  console.error('Failed to fetch data:', error);
  return c.json(
    { success: false, error: 'Failed to fetch data' },
    500
  );
}

// Frontend: Show error states in UI
@state() private errorMessage = '';

async loadData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Network error');
    this.data = await response.json();
  } catch (error) {
    this.errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error';
  }
}
```

### Async/Await Style

```typescript
// Prefer async/await over .then() chains
async function fetchUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// Handle multiple promises with Promise.all
const [users, settings] = await Promise.all([
  fetchUsers(),
  fetchSettings(),
]);
```

## Testing Approach

### Current Status
- **No automated unit tests** (Vitest/Jest not configured)
- Use `./test-phase2.sh` for automated backend API testing
- Manual UI testing via `STATUS.md` testing guide

### When Adding Tests (Future)
- Place test files next to source: `component.test.ts`
- Use descriptive test names: `test('should fetch pipelines on mount')`
- Mock Home Assistant WebSocket connections
- Test error states and loading states

## Development Workflow

### Using the Documentation

**When starting a new implementation:**
1. Read `STATUS.md` to understand the current state
2. Read `PLAN.md` to see the detailed requirements for the next phase
3. Optionally check `HISTORY.md` for context on past decisions

**File purposes:**
- **STATUS.md** - Current state, what's working, testing guide, troubleshooting
- **HISTORY.md** - Detailed completion reports for Phase 1 & 2, technical decisions
- **PLAN.md** - Future phases (2.5, 3, 4, 5) with detailed implementation notes
- **API.md** - Backend API reference (packages/backend/API.md)

### Phase 2 Complete ✅
- Backend API with auth & encryption
- Settings management UI
- Text-based chat interface
- Multi-turn conversations

### Phase 3 (Next): Desktop Integration
When working on Phase 3, refer to `PLAN.md` for detailed requirements.

### 🗑️ Cleanup After Implementation

**IMPORTANT:** Once Phase 3 (or any phase) is complete:

1. **Delete temporary status files:**
   ```bash
   rm v2/STATUS.md v2/HISTORY.md
   ```
   These are temporary documentation files that should be removed after Phase 3+ completion.

2. **Update PLAN.md:**
   - Move completed phase details to a brief summary
   - Keep only future phases detailed

3. **Remove this section from AGENTS.md:**
   - Delete the "Using the Documentation" and "Cleanup After Implementation" sections
   - Update "Documentation" section to remove STATUS.md and HISTORY.md references

4. **Code review should flag:**
   - If STATUS.md or HISTORY.md still exist after phase completion
   - If AGENTS.md still references these temporary files
   - Missing updates to PLAN.md

**Why delete?** These files are verbose working documents useful during active development but become outdated and confusing once the project moves forward. The essential information should be captured in README.md, API.md, and a streamlined PLAN.md.

## Common Patterns

### API Client (Frontend)
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const result = await response.json();
```

### Home Assistant WebSocket
Refer to `packages/backend/src/ha/client.ts` for connection patterns.

## Documentation

- **STATUS.md**: Current state, testing guide, troubleshooting (v2/ - **temporary**)
- **HISTORY.md**: Phase 1 & 2 completion details (v2/ - **temporary**)
- **PLAN.md**: Development roadmap and phases (v2/)
- **API.md**: Complete backend API documentation (v2/packages/backend/)

**Note:** STATUS.md and HISTORY.md are temporary working documents that should be deleted after Phase 3+ completion (see "Cleanup After Implementation" section above).

Always update relevant docs when changing APIs or adding features.

## Key Directories

```
v2/
├── packages/
│   ├── backend/src/        # Hono API server + HA client
│   ├── web/src/            # Lit web components
│   ├── desktop/src-tauri/  # Tauri 2 Rust backend
│   └── shared-types/src/   # Shared TypeScript types
```

---

**Version**: 1.1  
**Last Updated**: 2026-01-15  
**Changes**: Updated documentation references for consolidated STATUS/HISTORY/PLAN structure
