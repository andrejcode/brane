# Changelog

All notable changes to this project will be documented in this file. Each
release separates user-facing release notes from internal development changes
so the user changes can also be published in the app, on the website, or on
social media.

# v0.3.3 - 2026-10-22

## User changes

### Added

- Added copying of selected rendered math as TeX expressions, including
  selections containing surrounding text

### Updated

- Increased the settings window size
- Improved sidebar toggle alignment and header spacing
- Balanced focus spacing around the reasoning toggle

### Fixed

- Fixed formula spacing and compressed fractions in rendered math
- Excluded code block language labels and copy controls from text selections
- Excluded collapsed reasoning from copied text and the accessibility tree
- Preserved spacing above the expanded message input for message controls and
  the scroll-to-bottom button
- Prevented confirmation dialogs opened over settings from doubling the
  background dimming

## Development changes

### Updated

- Updated Electron to 41.10.7 and node-llama-cpp to 3.22.2 for security and
  runtime fixes
- Aligned KaTeX renderer and stylesheet versions
- Organized scroll area, tooltip, and menu components into dedicated folders,
  splitting tooltip and menu logic into smaller components and shared helpers
- Shared resize observer logic and extracted message input measurement and
  bottom inset calculations into dedicated helpers
- Expanded component and end-to-end regression coverage

# v0.3.2 - 2026-10-16

## User changes

### Updated

- Updated the Delete all chats button to show when deletion has completed

## Development changes

### Updated

- Isolated development database and logs inside the project while continuing to
  share models from `~/.brane`, and moved end-to-end test data to temporary storage

# v0.3.1 - 2026-10-04

### Fixed

- Prevented long lines in code blocks from expanding the chat width by making
  them horizontally scrollable

# v0.3.0 - 2026-10-02

## User changes

### Added

- Added an Appearance setting to show message dates
- Added optional generation statistics, including token count, generation
  speed, time to first token, stop reason, and current context usage
- Added confirmation before deleting all chats
- Added contextual copy-button labels and completion feedback

### Updated

- Improved select, search, number-stepper, and context-usage control styling

### Fixed

- Prevented links from opening in an external browser without confirmation
- Added visible warnings when chat history cannot be opened or saved while
  allowing the current conversation to continue

## Development changes

### Updated

- Migrated development builds from Electron Forge's Vite plugin to Electron
  Vite
- Preserved React Compiler transforms through the supported Vite React plugin
  integration
- Migrated application packaging from Electron Forge to Electron Builder, with
  DMG and ZIP artifacts on macOS
- Replaced Forge-style package scripts with conventional Electron Vite
  development, unpacked, and platform build commands
- Limited packaged production dependencies to `better-sqlite3` and
  `node-llama-cpp`, with native rebuilding and required runtime files unpacked
  from ASAR
- Preserved Electron fuse hardening in the new packaging configuration
- Updated screenshots and expanded Markdown renderer coverage
- Updated React, KaTeX, Lucide, Drizzle ORM, and related build dependencies
- Centralized main-process IPC registration outside the application lifecycle
  entry point

### Fixed

- Prevented locally built macOS applications from exiting with an invalid code
  signature after Electron fuse configuration
- Closed partially initialized SQLite connections after database startup
  failures

# v0.2.1 - 2026-09-27

This release improves keyboard shortcut discoverability and reliability.

## User changes

### Added

- Added configured keyboard shortcuts to action tooltips
- Added numbered shortcut hints for the first nine chats, revealed by holding
  Cmd/Ctrl

### Updated

- Increased spacing in settings for improved readability
- Improved model selection and loading feedback in the header

### Fixed

- Disabled main view shortcuts while a modal is open
- Fixed the model selector tooltip to show the appropriate shortcut

## Development changes

### Fixed

- Fixed pre-commit linting and formatting

# v0.2.0 - 2026-09-20

These changes are focused on UI/UX improvements.

## User changes

### Added

- Added a setting to load the selected model automatically on startup
- Added a New chat button to the sidebar and hid the header’s New chat button when the sidebar is open.
- Added customizable Cmd/Ctrl+F shortcut to open the sidebar and focus chat
  search
- Added custom scrollbars throughout the app
- Added persisted context token usage to assistant messages, with an Appearance
  setting to show or hide it
- Added an Appearance setting to show pointer cursors over interactive controls,
  disabled by default

### Updated

- Improved error and log messages
- Changed startup to remember the selected model without loading it until the
  first message
- Improved sidebar chat actions with an overlay layout and animated menus
- Improved New chat button transitions when opening or closing the sidebar
- Improved chat search accessibility and keyboard dismissal behavior
- Changed right-click chat menus to open at the pointer position

### Fixed

- Fixed layout shifts when renaming chats
- Fixed the window readiness fallback after the renderer reloads

## Development changes

### Updated

- Upgraded node-llama-cpp version

### Fixed

- Stopped renderer console messages from being persisted to app logs

# v0.1.0 - 2026-09-08

### Added

- Initial release
