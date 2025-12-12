# Timeline visualizer

Interactive React app for exploring multi-line timelines. It renders tracks with date ranges, milestones, sprint guides, and a minimap so you can zoom or export a single-file HTML snapshot to share.

## Quick start

- Install: `npm install`
- Develop: `npm run dev` then open the printed localhost URL.
- Build: `npm run build` (outputs to `dist/`).
- Single-file export: `npm run export:single` (builds then writes `dist/timeline-single.html` with inline JS/CSS/icons).

## Data

Default data lives in `src/data/branchTracks.json` and `src/data/milestones.json`. You can override the tracks file without touching the source by passing a path at build or dev time:

- CLI flag: `npm run dev -- --branchTracks=./path/to/tracks.json` (alias: `--tracks`)
- Env var: `BRANCH_TRACKS_FILE=./path/to/tracks.json npm run build`
- npm config style also works: `npm run build -- --branchTracks=...`

The file must contain an array of tracks with `id`, `name`, `colour`, `items` (each item needs `id`, `name`, `at`, `endAt`, optional `annotation`), plus optional `startWeek`/`endWeek`. See `src/data/branchTracks.json` for a reference shape.

Milestones are read from `src/data/milestones.json`.

## Exporting a shareable HTML

Run `npm run export:single`. It:
- builds the app,
- inlines the generated JS/CSS and icons into one file, and
- writes `dist/timeline-single.html` you can open locally or attach to an email/issue without extra assets.

## Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – type-check and build to `dist/`
- `npm run export:single` – build then create the all-in-one HTML export
- `npm run lint` – lint the project
