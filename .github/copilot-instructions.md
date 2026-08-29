# Brane Repository Instructions

Brane is an Electron desktop chat app that runs local GGUF models on-device with
`node-llama-cpp`. It has no backend or network service.

## Architecture

- `src/main/**` is the Node/Electron main process. It owns the window, model
  runtime, model discovery, persistence, logging, and all `ipcMain` handlers.
- `src/preload/**` is the context-isolated bridge. It exposes one typed
  `electronApi` object through `contextBridge`; its global `ElectronApi` type is
  declared in `src/preload/api.d.ts`.
- `src/renderer/**` is the React 19 UI. It communicates with the main process
  only through `window.electronApi`; never import from `src/main` or use
  `ipcRenderer` in renderer code.
- `src/shared/**` contains types and constants shared across processes, including
  `IpcChannels` and IPC payload types. This is the safe cross-layer import.
- Use path aliases instead of long relative import chains: `@shared/types`,
  `@shared/*`, `@/*` for the renderer root, and `@test/*`.

## Code Style

- Write self-explanatory code with descriptive names and small, single-purpose
  functions. Prefer early-return guards over deep nesting.
- Follow Prettier: no semicolons, single quotes, and 2-space indentation.
- Use `import type` for type-only imports because `verbatimModuleSyntax` is
  enabled.
- Let ESLint's `import/order` rule sort imports. Run `npm run lint:fix` instead of
  sorting them manually.
- Use descriptive, verb-first function names and `UPPER_SNAKE_CASE` for
  module-level constants.
- Extract private helpers at module scope and keep exported surfaces obvious.
- Use a named `interface` options object when a function accepts several
  parameters.
- Prefer `interface` for object shapes and `type` for unions and aliases.
- Model variants as discriminated unions. Use `as const` arrays or objects for
  enum-like values and derive their types.
- Infer obvious return types; annotate them only when it improves clarity or
  safety.
- The project enables `strict`, `noUncheckedIndexedAccess`, and
  `exactOptionalPropertyTypes`. Handle possibly missing indexed values and do
  not pass `undefined` to optional properties.
- For non-critical read failures, return an appropriate fallback such as `[]` or
  `null`. For actionable failures, log the raw error and throw an `Error` with a
  deliberate user-facing message; never expose a caught error's message
  directly.
- Default to no comments. Add comments only for non-obvious reasons, tradeoffs,
  caveats, or platform quirks. Do not leave narrated, commented-out, or edit-log
  comments. Justify lint suppressions inline.

## Commands

- Use Node.js 22 and install dependencies with `npm install`.
- Run the app with `npm start`.
- Run tests with `npm test`; use `npm run test:watch` while developing.
- Run linting with `npm run lint`; apply fixes with `npm run lint:fix`.
- Run type checking with `npm run typecheck`, or use the layer-specific
  `typecheck:main`, `typecheck:preload`, `typecheck:renderer`, and
  `typecheck:test` scripts.
- Run formatting with `npm run format` and check it with
  `npm run format:check`.
- Before considering a change complete, run `npm run trinity` to lint,
  type-check, and test the repository.
