# Repository Guidelines

## Project Structure & Module Organization

Poetry IDE is an Astro application with React islands, CodeMirror 6, and Tailwind CSS for writing Spanish poetry.

- `src/poetry/`: deterministic TypeScript engine for phonology, syllabification, meter, rhythm, rhyme, forms, and diagnostics. Keep linguistic logic independent of React and browser APIs; expose shared analysis through `index.ts`.
- `src/components/`: React UI organized by feature, including editor, inspector, topbar, statusbar, and statistics.
- `src/pages/` and `src/layouts/`: Astro entry point and page shell.
- `src/styles/global.css`, `src/data/samplePoems.ts`, and `public/`: shared styles, example poems, and static assets.
- `tests/unit/` and `tests/e2e/`: engine/unit tests and browser workflows.

## Build, Test, and Development Commands

Use pnpm and maintain `pnpm-lock.yaml` when changing dependencies.

- `pnpm install`: install dependencies.
- `pnpm dev`: start the Astro development server on port 4321.
- `pnpm check`: run Astro and TypeScript diagnostics.
- `pnpm build`: run diagnostics, then create the production build.
- `pnpm preview`: serve the production build locally.
- `pnpm test` / `pnpm test:watch`: run Vitest once or in watch mode.
- `pnpm test:e2e`: run Playwright desktop Chromium and Pixel 5 browser projects.

For browser tests, run `pnpm exec playwright install chromium` once and start `pnpm dev` separately; Playwright does not start a server. Override the target with `BASE_URL=https://example.com pnpm test:e2e`.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, single-quoted strings, and semicolons for statements; match surrounding code. Name React components and types in PascalCase, functions and variables in camelCase, and utility files after their purpose (for example, `analyzeVerse.ts`). Use `@/` for imports rooted in `src/` and explicit type imports. Preserve Spanish UI copy and reuse existing Tailwind utilities and CSS variables. No ESLint or Prettier configuration is currently provided.

## Testing Guidelines

Name unit tests `tests/unit/*.test.ts` and browser tests `tests/e2e/*.spec.ts`. Vitest runs in Node; no coverage threshold is configured. Add focused regression cases for linguistic changes with explicit expected syllable counts, stress, or rhyme. Cover changed editor interactions with Playwright and reset localStorage to isolate cases. Run relevant tests and `pnpm build` before submitting.

## Commit & Pull Request Guidelines

Follow the history's Conventional Commit prefixes: `feat:`, `fix:`, and `chore:` with short, imperative descriptions. Keep commits focused. PRs should explain the behavior change, link relevant issues, report validation commands and results, and include screenshots for visible UI changes.
