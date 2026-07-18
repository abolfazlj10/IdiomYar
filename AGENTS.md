# Project Instructions

## Design Preferences

- Do not use book photos or book imagery anywhere in this project's UI or visual design.
- The app may still refer to book-related study concepts in text, but visual assets should use non-book metaphors such as cards, conversation, practice, notes, progress, language, or abstract learning patterns.

## Package Management

- Bun is the only package manager for this project. Use only `bun` and `bunx`.
- Never run interactive commands.

## Verification

- Use `bun run check` for the normal project verification cycle.
- Keep `bun run build` separate from `check`. Run it only once at the end of a task and only when changes affect routes, configuration, dependencies, or the production build.
- For scoped changes, check only the relevant files first.
- Do not repeat a successful verification without a concrete reason.
- Use browser verification only for visible UI changes.
- Reuse the development server on port `3006` for UI work.
- Do not run multiple development servers on different ports.
