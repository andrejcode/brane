# Changelog

All notable changes to this project will be documented in this file.

# Unreleased

## Added

- Added a setting to load the selected model automatically on startup
- Added a New chat button to the sidebar
- Added customizable Cmd/Ctrl+F shortcut to open the sidebar and focus chat
  search
- Added custom scrollbars throughout the app
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
