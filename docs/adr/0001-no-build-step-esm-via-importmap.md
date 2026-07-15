# 0001 — No build step; ESM via import map

*Status: accepted · 2026-07-14*

## Context
The piece must deploy like the heart demo it answers: edit a file, push, it's live
on GitHub Pages. It is also a "view-source" artifact — the code should be readable
exactly as shipped.

## Decision
No bundler, no build step. `index.html` carries an import map; `src/*.js` are native
ES modules; Three.js loads from the jsDelivr CDN. A `.nojekyll` file makes Pages
serve everything verbatim.

## Consequences
- `edit → git push → live`, no CI.
- Must be served over http(s) (ES modules); cannot be opened as a `file://` URL.
- Depends on the CDN being up; the Three.js version is pinned in the import map.
