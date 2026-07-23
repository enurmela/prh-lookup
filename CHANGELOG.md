# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Added preview shortcuts to copy a company's Y-tunnus with `Command-C` and open its website with `Command-O`.
- Documented the feature-branch and Store-release workflow.

### Fixed

- Prevented persisted search-cache updates from retriggering the search effect in a render loop.

## [0.1.0] - 2026-07-23

### Added

- Initial beta release of FBL - Finnish Business Lookup for Raycast.
- Search Finnish businesses by company name or Business ID using PRH YTJ open data.
- Review ranked results and company details, including status, addresses, registers, and name history.
- Copy IDs and addresses, open source pages, websites, and map links.
- Read release notes in-app from the "What's New" section.
- Root `LICENSE` file (MIT).
- `CHANGELOG.md` for release history.

### Changed

- Extension branding renamed from "PRH Lookup" to "FBL - Finnish Business Lookup".
- Publish script aligned with Raycast's npm-based publish flow (`npx @raycast/api@latest publish`).
- Search placeholder shortened to reduce truncation in Raycast list view.

### Removed

- Favorites UI, actions, and local favorites behavior from the command.
