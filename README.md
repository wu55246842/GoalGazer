# GoalGazer

GoalGazer is an automated football tactical recap platform built with Next.js and a Python data pipeline. Each match produces a narrative article with original charts, derived metrics, and transparent sourcing.

## Features

- **Next.js App Router** front-end with SEO metadata, JSON-LD, sitemap, and compliance pages.
- **Python pipeline** to fetch data, normalize it, generate charts, and compose JSON articles.
- **LLM analysis** with strict JSON schema validation, evidence traceability, and a fallback draft when the API is unavailable.
- **Automation-ready** pipeline with a Node CLI wrapper and GitHub Actions workflow.

## Repository Layout

```
apps/web              # Next.js site
tools/pipeline/python # Python pipeline (fetch -> normalize -> plot -> llm -> compose)
tools/pipeline/node   # Node CLI wrapper
.github/workflows     # Automation workflow
```

## Quick Start

### 1) Install dependencies

```bash
npm install
pip install -r tools/pipeline/python/requirements.txt
npm --prefix apps/web install
```

### 2) Configure environment

Copy `.env.example` to `.env` and populate credentials when available:

```bash
cp .env.example .env
```

### 3) Generate content (mock data)

If `API_FOOTBALL_KEY` is not set, the pipeline uses `tools/pipeline/python/goalgazer/mock_data/match_12345.json`.

```bash
npm run pipeline -- --matchId 12345
```

This produces:

- `apps/web/content/matches/{date}_12345.json`
- `apps/web/content/index.json`
- `apps/web/public/generated/matches/12345/*.png`

### 4) Run the web app

```bash
npm run web:dev
```

Visit `http://localhost:3000` and open the generated match page.

## Chart Generation Notes

- Charts are created with **mplsoccer + matplotlib**.
- **Pass network** uses successful passes to estimate player positions and pass links.
- **Shot map** uses shot locations and outcomes (goal/saved/miss/blocked).
- All outputs are high-resolution PNGs (`dpi=200`, width >= 1600px).

### Generate charts from mock data

```bash
python -m goalgazer --matchId 12345
```

The images will be created under:

```
apps/web/public/generated/matches/12345/
  pass_network_home.png
  pass_network_away.png
  shot_map.png
  touch_heatmap_home.png
```

> Note: Images are generated at runtime and are not committed to the repository.

## LLM Safety & Compliance

- Outputs must be **strict JSON** validated against a schema.
- Every claim includes evidence keys that map to known data fields.
- Betting or gambling content is explicitly forbidden in the system prompt.
- If the LLM API is unavailable, a conservative fallback draft is generated.

## Automation (GitHub Actions)

A scheduled workflow runs daily at 02:00 UTC and executes the pipeline. The workflow commits new content if changes are detected.

## Deployment

Deploy `apps/web` to Vercel. The site is static/ISR-ready and can render JSON content directly.

## Compliance Pages

The site ships with About, Privacy, Contact, Data Sources, and Editorial Policy pages to support SEO and advertising compliance.
