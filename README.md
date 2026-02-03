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

### 3) Generate content 
If `API_FOOTBALL_KEY` is not set, the pipeline uses `tools/pipeline/python/goalgazer/mock_data/match_12345.json`.

```bash
npm run pipeline -- --matchId 12345
```

This produces:

- `apps/web/content/matches/{date}_12345.json`
- `apps/web/content/index.json`
- `tools/pipeline/.cache/generated/matches/12345/*.png`

### 4) Run the web app

```bash
npm run web:dev
```

Visit `http://localhost:3000` and open the generated match page.

## Data Pipeline Logic

The GoalGazer pipeline follows a robust **ETL + Intelligent Analysis** workflow, transforming raw football data into structured web content with HD visualizations and AI-driven tactical insights.

### 1. Data Extraction
Handled by `fetch_api_football.py`:
- **Trigger**: CLI execution with a specific `matchId`.
- **Source**: API-FOOTBALL (v3) core endpoints (`/fixtures`, `/fixtures/statistics`, `/fixtures/events`, `/fixtures/lineups`).
- **Caching**: Local caching in `tools/pipeline/.cache` to optimize API usage and speed.

### 2. Normalization & Transformation
Handled by `normalize.py`:
- **Unified Model**: Maps diverse API responses to a standardized `MatchData` model.
- **Pitch Mapping**: Converts raw location data to 0-100 standard pitch coordinates.
- **Derived Metrics**: Calculates advanced indicators (e.g., shot tempo, danger zones) in `compose_article.py`.

### 3. HD Visualizations
Handled by `plots_*.py` modules using `mplsoccer` + `matplotlib`:
- **Shot Map**: Visualize all attempts with outcome color-coding.
- **Pass Network & Formation**: Calculate average player positions and passing frequency links.
- **Production**: Renders high-resolution PNGs (1600px width, 200 DPI) to `tools/pipeline/.cache/generated/` before uploading to R2.

### 4. AI Tactical Analysis
Handled by `llm_generate.py`:
- **Context Construction**: Combines normalized data and metrics into a comprehensive "Fact Pack" for the LLM.
- **Strict Prompting**: Enforces high-fidelity analysis based *only* on provided facts (No hallucinations).
- **Validation**: Strict JSON schema checks ensure high output quality.

### 5. Content Publishing
Finalized by `compose_article.py`:
- **Synthesis**: Merges AI text, chart paths, and match metadata into a final JSON article.
- **Persistence**: Writes content to `apps/web/content/matches/` and updates the global `index.json`.

#### Core Principles
- **Offline Generation**: Real-time rendering is offloaded to pre-generation, ensuring lightning-fast site performance.
- **Evidence-Based**: Every AI claim is backed by data evidence to minimize hallucinations.
- **Graceful Degradation**: System falls back to data-only summaries if LLM or API services are unreachable.

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
tools/pipeline/.cache/generated/matches/12345/
  pass_network_home.png
  pass_network_away.png
  shot_map.png
  touch_heatmap_home.png
```

> Note: Images are generated at runtime, uploaded to R2, and are not committed to the repository.

## LLM Safety & Compliance

- Outputs must be **strict JSON** validated against a schema.
- Every claim includes evidence keys that map to known data fields.
- Betting or gambling content is explicitly forbidden in the system prompt.
- If the LLM API is unavailable, a conservative fallback draft is generated.

## Automation (GitHub Actions)

A scheduled workflow runs hourly and executes the pipeline. Results are stored in the database/R2, so no repository assets are committed.

## Deployment

Deploy `apps/web` to Vercel. The site is static/ISR-ready and can render JSON content directly.

## Compliance Pages

The site ships with About, Privacy, Contact, Data Sources, and Editorial Policy pages to support SEO and advertising compliance.

## Database
npx tsx tools/pipeline/node/init_db.ts    

## pipline execute
npm run pipeline
npm run pipeline -- --league epl --season 2025
npm run pipeline -- "league=seriea" "season=2025"

# generate daily digest
npx tsx tools/pipeline/node/generate_daily_digest.ts 2026-01-31
npx tsx tools/pipeline/node/generate_daily_digest.ts 2026-01-31 --league liga

npm run web:dev

# backup all the data to SQL format  
npx tsx tools/backup_database.ts --format sql

# overwrite a match
npx tsx tools/pipeline/node/run_pipeline_overwrite.ts --matchId=1391029
