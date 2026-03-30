# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for **LOCA-bench** (LOng-Context Agents Benchmark) — a leaderboard comparing LLM agents' accuracy across different context lengths. Deployed via GitHub Pages from the `docs/` folder.

## Build Commands

| Command | Description |
|---------|-------------|
| `make install` | Install Python deps via `uv sync` |
| `make build` | Generate static site into `docs/` |
| `make serve` | Build + local dev server at `http://localhost:9000` |
| `make clean` | Remove `docs/` and `.venv/` |

There are no tests or linting configured.

## Architecture

**Static site generator:** `build.py` uses Jinja2 to render templates with data from `data/leaderboards.json`, outputting to `docs/`.

**Source files to edit:**
- `templates/` — Jinja2 templates (`base.html` is the layout, `_sidebar.html` and `_leaderboard_table.html` are partials, `pages/` has page content)
- `css/` — Modular CSS (`main.css` imports all others; `core.css` has design tokens/variables)
- `js/mainResults.js` — Client-side leaderboard rendering, sorting, and Chart.js line charts
- `data/leaderboards.json` — All leaderboard data (accuracy + context management)

**Never edit files in `docs/` directly** — they are generated output. Always run `make build` after changes.

**Data flow:** `build.py` passes leaderboard JSON to Jinja2 → `_leaderboard_table.html` embeds it as a `<script type="application/json">` tag → `mainResults.js` reads it client-side and renders interactive tables + charts.

**Two leaderboard tabs on the main page:**
- "Main Accuracy" — models ranked by accuracy across 7 context lengths (8K–256K)
- "Context Management (128K)" — models grouped by context management strategy

**External CDN deps:** Font Awesome 6.2.0, Chart.js (jsdelivr).

## Deployment

Manual process: edit source → `make build` → commit `docs/` → push to `master`. No CI/CD workflows. GitHub Pages serves from `docs/` on `master`.

## Notes

- Python >=3.8, single dependency: `jinja2>=3.0.0`, managed with `uv`
- Pre-commit hooks: `check-yaml` and `check-case-conflict`
- The README.md is outdated (still references SWE-bench); the actual site has only 2 pages (index + citations)
- License: CC BY-NC 4.0
