---
applyTo: 'src/main/**/*.ts,src/preload/**/*.ts,src/shared/types/**/*.ts'
---

# IPC And Main Process Instructions

All main-to-renderer communication uses named channels defined once in
`@shared/types`. Add a cross-process feature in this order:

1. Add the channel (`domain:action`) to the `IpcChannels` `as const` object in
   `src/shared/types/index.ts`, together with payload and return types.
2. Register the handler in `src/main/<feature>.ts` through an exported
   `register<Feature>Handlers()` function using `ipcMain.handle`.
3. Call that registration function from `app.whenReady()` in
   `src/main/index.ts`.
4. Add a wrapper around `ipcRenderer.invoke` to `electronApi` in
   `src/preload/index.ts`, and declare it on the global `ElectronApi` interface
   in `src/preload/api.d.ts`.

- Treat incoming handler arguments as `unknown` and validate them with type
  guards. Reject invalid input with a deliberate user-facing `Error`.
- Log meaningful events and all rejections with the shared `logger`.
- Persist state only through `getStoreValue` and `setStoreValue` against the
  typed `StoreSchema`; do not use `electron-store` directly elsewhere.
- Stream long-running output through `webContents`, guarded by `isDestroyed()`,
  and support cancellation with `AbortController` rather than waiting for an
  invoke response.
- Treat preload as a trust boundary. Normalize and validate `unknown` values
  returned by `invoke` so renderer code receives safe typed data.
- Expose exactly one `electronApi` object through `contextBridge`; never expose
  `ipcRenderer` itself.
- Subscription methods return an unsubscribe function that calls
  `removeListener`.
