# Changelog

All notable changes to this project will be documented in this file.

# v0.2.1 - 2026-09-27

This release improves keyboard shortcut discoverability and reliability.

## Added

- Added configured keyboard shortcuts to action tooltips
- Added numbered shortcut hints for the first nine chats, revealed by holding
  Cmd/Ctrl

## Updated

- Increased spacing in settings for improved readability
- Improved model selection and loading feedback in the header

## Fixed

- Disabled main view shortcuts while a modal is open
- Fixed the model selector tooltip to show the appropriate shortcut
- Fixed pre-commit linting and formatting

# v0.2.0 - 2026-09-20

These changes are focused on UI/UX improvements.

## Added

- Added a setting to load the selected model automatically on startup
- Added a New chat button to the sidebar and hid the header’s New chat button when the sidebar is open.
- Added customizable Cmd/Ctrl+F shortcut to open the sidebar and focus chat
  search
- Added custom scrollbars throughout the app
- Added persisted context token usage to assistant messages, with an Appearance
  setting to show or hide it
- Added an Appearance setting to show pointer cursors over interactive controls,
  disabled by default

## Updated

- Upgraded node-llama-cpp version
- Improved error and log messages
- Changed startup to remember the selected model without loading it until the
  first message
- Improved sidebar chat actions with an overlay layout and animated menus
- Improved New chat button transitions when opening or closing the sidebar
- Improved chat search accessibility and keyboard dismissal behavior
- Changed right-click chat menus to open at the pointer position

## Fixed

- Fixed layout shifts when renaming chats
- Fixed the window readiness fallback after the renderer reloads
- Stopped renderer console messages from being persisted to app logs

# v0.1.0 - 2026-09-08

Initial release
