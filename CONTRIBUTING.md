# Contributing to Brane

Thank you for helping improve Brane. Contributions can include bug fixes,
features, tests, documentation, accessibility improvements, and translations.

## Development setup

You need Node.js 22 and npm.

```sh
npm install
npm start
```

Useful commands:

```sh
npm test                 # Run the Vitest suite
npm run test:watch       # Run tests while developing
npm run lint             # Check ESLint rules
npm run lint:fix         # Apply available ESLint fixes
npm run typecheck        # Type-check every process
npm run format:check     # Check Prettier formatting
npm run trinity          # Run lint, type-checking, and tests
npm run make             # Build platform installers/packages
```

Run `npm run trinity` before submitting a contribution.

## Architecture

Brane is an Electron app with no backend or network service.

- `src/main` owns native Electron behavior, model discovery and inference,
  SQLite persistence, settings, logs, and IPC handlers.
- `src/preload` exposes the context-isolated `window.electronApi` bridge.
- `src/renderer` contains the React 19 interface and communicates with the main
  process only through that bridge.
- `src/shared` contains IPC channels and types shared across process boundaries.
- `src/test` contains reusable test mocks and setup.
- `drizzle` contains the SQLite schema migrations.

Use the existing path aliases: `@shared/types`, `@shared/*`, `@/*` for the
renderer, and `@test/*` in tests.

## How core features work

### Models and inference

Brane creates and watches `~/.brane/models`. The main process discovers regular
files ending in `.gguf`, persists the selected filename, and validates that the
file still exists. `node-llama-cpp` loads the selected model, creates a chat
context, and streams response events to the renderer over IPC. Loading another
model first aborts active work and disposes the current model to avoid keeping
two models in memory.

Model files are never committed to this repository or bundled with the app.

### Chats and persistence

Chats and messages are stored locally in SQLite through Drizzle ORM. A chat
records the model filename and file size used when it was created. This allows
Brane to identify missing or replaced models and make affected chats read-only.
Stored chat history is used to prime the model session when a conversation is
reopened.

### Settings and application state

Theme, locale, selected model, sidebar state, keyboard shortcuts, and chat
preferences are owned by the main process and persisted with `electron-store`.
Renderer contexts provide those values to React components. Shared IPC payloads
belong in `src/shared/types`. Renderer code must not import from `src/main` or
access `ipcRenderer` directly.

### Response rendering

The renderer supports GitHub-flavored Markdown, syntax-highlighted code, KaTeX
math, and sanitized HTML. Keep sanitization in place when changing message
rendering. Some models emit reasoning segments. These are stored separately for
display and are not replayed into future model context.

## Code guidelines

- Follow the existing TypeScript style: no semicolons, single quotes, and
  two-space indentation.
- Use `import type` for type-only imports.
- Prefer small functions, early returns, descriptive names, and existing local
  patterns.
- Keep Electron process boundaries intact and define typed IPC contracts for
  cross-process behavior.
- Add focused tests for changed behavior. Broaden coverage for shared contracts
  or user-facing workflows.
- Do not include model files, generated packages, local databases, or logs.
- Update user documentation when behavior visible to users changes.

## Translating Brane

Translation contributions do not require application development experience.
The source files are plain TypeScript objects in `src/renderer/i18n`.

To improve an existing language:

1. Use `src/renderer/i18n/en.ts` as the source of truth.
2. Edit the corresponding catalog: `de.ts`, `hr.ts`, or `sr.ts`.
3. Translate values only and do not change translation keys.
4. Keep placeholders such as `{query}` and `{shortcut}` unchanged.
5. Update the matching entries in `introMessages.ts` when applicable.
6. Run `npm run typecheck:renderer` to check that every key is present.

To add a language:

1. Add its locale code to `LOCALES` in `src/shared/types/index.ts`.
2. Create a catalog in `src/renderer/i18n` with every key from `en.ts`.
3. Import the catalog and register it in `messages` in
   `src/renderer/i18n/index.ts`.
4. Add the language's native name to `LOCALE_OPTIONS`.
5. Add translated greetings to `introMessages.ts`.
6. Run `npm run trinity`.

Translations should sound natural in their target language rather than mirror
English word for word. Check buttons, dialogs, placeholders, and longer error
messages in the running app for clipping and context.

## Submitting a change

Keep each contribution focused and explain the user-visible behavior it changes.
Include reproduction steps for bug fixes and screenshots for visual changes.
Document any checks you could not run.

Commit messages must follow the
[Conventional Commits](https://www.conventionalcommits.org/) format:

```text
<type>(<scope>): <description>
```

Use a clear, lowercase description in the imperative mood. The scope is
optional. Common types include `feat`, `fix`, `docs`, `test`, `refactor`,
`style`, `perf`, `build`, and `chore`.

Examples:

```text
feat(chat): add message regeneration
fix(models): handle removed model files
docs: clarify model requirements
feat(i18n): add French translations
```

Mark breaking changes according to the Conventional Commits specification. By
contributing, you agree that your work is provided under the repository's MIT
License.
