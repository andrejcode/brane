# Changelog

All notable changes to this project will be documented in this file. Each
release separates user-facing release notes from internal development changes
so the user changes can also be published in the app, on the website, or on
social media.

# Unreleased

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

### Fixed

- Prevented locally built macOS applications from exiting with an invalid code
  signature after Electron fuse configuration

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

## User changes

### Added

- Initial release
