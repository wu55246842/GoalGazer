import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { generateText } from "../../../apps/web/lib/pollinations";

type SupportedLanguage = "zh" | "ja";

const PROMPTS: Record<SupportedLanguage, string> = {
  zh: `You are a professional sports localization translator and JSON editor.

Task:
Translate ONLY the human-readable STRING VALUES in the JSON from English to Simplified Chinese (zh-CN).
Return STRICT JSON only. No extra text.

Hard rules:
1) Do NOT change any JSON keys, object/array structure, ordering, or indentation style beyond normal JSON formatting.
2) Do NOT change any numbers, IDs, dates, URLs, filenames, paths, or enum-like codes.
   - Keep matchId, ids, minute, score values, xg, passes_total, ratings, etc. unchanged.
   - Keep all URLs and image paths unchanged (e.g., "/generated/matches/...").
3) Do NOT translate proper nouns in structured identity fields:
   - Keep match.homeTeam.name, match.awayTeam.name, players[*].name, timeline[*].playerName/teamName exactly as-is.
4) Factual data subtrees (match, players, team_stats, data_provenance) should be kept exactly as they are in the input. You may even omit them if token limits are an issue, as they will be re-injected by the system.
5) Translate the following fields’ string values naturally and accurately:
   - frontmatter.title, frontmatter.description, frontmatter.tags[*]
   - figures[*].alt, figures[*].caption
   - sections[*].heading
   - sections[*].paragraphs[*]
   - sections[*].bullets[*]
   - sections[*].claims[*].claim   (IMPORTANT: keep claims[*].evidence unchanged)
   - player_notes[*].summary, player_notes[*].player, player_notes[*].team (NOTE: if these are team/player proper nouns, keep as-is)
   - multiverse.summary
   - multiverse.pivots[*].description
   - multiverse.pivots[*].reality.event, multiverse.pivots[*].reality.outcome, multiverse.pivots[*].reality.tactical_impact
   - multiverse.pivots[*].symmetry.event, multiverse.pivots[*].symmetry.outcome, multiverse.pivots[*].symmetry.tactical_impact
   - data_limitations[*], cta
   - timeline[*].detail can be translated if it is a descriptive phrase like "Red Card", "Yellow Card", "Substitution", but KEEP timeline[*].type unchanged.
6) Keep diacritics/case for proper nouns if you keep them as-is (e.g., "Nélson Semedo").
7) Output must be valid JSON that preserves all original non-translated values.`,

  ja: `You are a professional sports localization translator and JSON editor.

Task:
Translate ONLY the human-readable STRING VALUES in the JSON from English to Japanese (ja-JP).
Return STRICT JSON only. No extra text.

Hard rules:
1) Do NOT change any JSON keys, object/array structure, ordering, or indentation style beyond normal JSON formatting.
2) Do NOT change any numbers, IDs, dates, URLs, filenames, paths, or enum-like codes.
   - Keep matchId, ids, minute, score values, xg, passes_total, ratings, etc. unchanged.
   - Keep all URLs and image paths unchanged (e.g., "/generated/matches/...").
3) Do NOT translate proper nouns in structured identity fields:
   - Keep match.homeTeam.name, match.awayTeam.name, players[*].name, timeline[*].playerName/teamName exactly as-is.
4) Factual data subtrees (match, players, team_stats, data_provenance) should be kept exactly as they are in the input.
5) Translate the following fields’ string values naturally and accurately:
   - frontmatter.title, frontmatter.description, frontmatter.tags[*]
   - figures[*].alt, figures[*].caption
   - sections[*].heading
   - sections[*].paragraphs[*]
   - sections[*].bullets[*]
   - sections[*].claims[*].claim   (IMPORTANT: keep claims[*].evidence unchanged)
   - player_notes[*].summary, data_limitations[*], cta
   - multiverse.summary
   - multiverse.pivots[*].description
   - multiverse.pivots[*].reality.event, multiverse.pivots[*].reality.outcome, multiverse.pivations[*].reality.tactical_impact
   - multiverse.pivots[*].symmetry.event, multiverse.pivots[*].symmetry.outcome, multiverse.pivots[*].symmetry.tactical_impact
   - timeline[*].detail may be translated when it is a descriptive phrase like "Red Card", "Yellow Card", "Substitution", but KEEP timeline[*].type unchanged.
6) Output must be valid JSON and preserve all original non-translated values.`
};

const schemaPath = path.resolve(process.cwd(), "tools/pipeline/python/goalgazer/schema_match_analysis.json");

export async function translateArticle(
  englishArticle: Record<string, unknown>,
  targetLanguage: SupportedLanguage
): Promise<Record<string, unknown>> {
  const attemptLimit = 4;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
    try {
      const payload = await requestTranslation(englishArticle, targetLanguage, attempt);

      // FIX: Re-inject original factual data to guarantee integrity and pass validation.
      // We start with the original English article as a total baseline.
      const merged: any = {
        ...englishArticle,
        ...payload,
        // Hard-lock fact subtrees
        match: englishArticle.match,
        team_stats: englishArticle.team_stats,
        players: englishArticle.players,
        data_provenance: englishArticle.data_provenance,
      };

      // Restore locked frontmatter fields
      if (merged.frontmatter && englishArticle.frontmatter) {
        const lockedFM = ["date", "matchId", "league", "teams", "heroImage"];
        for (const key of lockedFM) {
          (merged.frontmatter as any)[key] = (englishArticle.frontmatter as any)[key];
        }
      }

      // Restore locked figure fields (except alt/caption which should be translated)
      if (Array.isArray(merged.figures) && Array.isArray(englishArticle.figures)) {
        merged.figures = englishArticle.figures.map((origFig: any, idx: number) => {
          const transFig = (merged.figures as any)[idx] || {};
          return {
            ...origFig,
            alt: transFig.alt || origFig.alt,
            caption: transFig.caption || origFig.caption
          };
        });
      }

      validateTranslation(englishArticle, merged);
      return merged;
    } catch (error) {
      lastError = error as Error;
      if (attempt < attemptLimit) {
        console.warn(`⚠️ Translation validation failed. Retrying (${attempt}/${attemptLimit}) in 5 seconds... Error: ${(error as any).message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.error(`❌ Translation failed for ${targetLanguage} after ${attemptLimit} attempts. Using English fallback.`);
  console.error("Last Error:", lastError);
  return englishArticle;
}

async function requestTranslation(
  englishArticle: Record<string, unknown>,
  targetLanguage: SupportedLanguage,
  attempt: number
): Promise<Record<string, unknown>> {
  const retryNote =
    attempt > 1
      ? "\nNOTE: This is a retry. Please ensure strict JSON output and follow all rules carefully."
      : "";

  const systemPrompt = PROMPTS[targetLanguage] + retryNote;

  const userPrompt = `Input JSON:\n<<<JSON\n${JSON.stringify(englishArticle, null, 2)}\nJSON\n>>>`;

  const responseText = await generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "openai",
    jsonMode: true,
  });

  let cleanText = responseText.trim();
  // Strip markdown code blocks if present (Pollinations/Gemini sometimes wraps JSON in ```json ... ```)
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error. Response was:", cleanText);
    throw e;
  }
}

function validateTranslation(
  englishArticle: Record<string, unknown>,
  translatedArticle: Record<string, unknown>
): void {
  validateSchemaWithPython(translatedArticle);

  ensureEqualKeys(englishArticle, translatedArticle);
  ensureFactParity(englishArticle, translatedArticle);
  ensureEvidenceParity(englishArticle, translatedArticle);
  ensureFrontmatterParity(englishArticle, translatedArticle);
  ensureFigureParity(englishArticle, translatedArticle);
}

function ensureEqualKeys(
  englishArticle: Record<string, unknown>,
  translatedArticle: Record<string, unknown>
): void {
  const englishKeys = Object.keys(englishArticle).sort();
  const translatedKeys = Object.keys(translatedArticle).sort();
  if (!deepEqual(englishKeys, translatedKeys)) {
    throw new Error("Top-level keys changed in translation.");
  }
}

function ensureFactParity(
  englishArticle: Record<string, unknown>,
  translatedArticle: Record<string, unknown>
): void {
  const factKeys = ["match", "team_stats", "players", "data_provenance"];
  for (const key of factKeys) {
    if (!deepEqual(englishArticle[key], translatedArticle[key])) {
      throw new Error(`Fact subtree mismatch: ${key}`);
    }
  }
}

function ensureEvidenceParity(
  englishArticle: Record<string, unknown>,
  translatedArticle: Record<string, unknown>
): void {
  const englishEvidence = collectEvidence(englishArticle);
  const translatedEvidence = collectEvidence(translatedArticle);
  if (!deepEqual(englishEvidence, translatedEvidence)) {
    throw new Error("Evidence arrays changed during translation.");
  }
}

function ensureFrontmatterParity(
  englishArticle: Record<string, unknown>,
  translatedArticle: Record<string, unknown>
): void {
  const englishFrontmatter = (englishArticle.frontmatter || {}) as Record<string, unknown>;
  const translatedFrontmatter = (translatedArticle.frontmatter || {}) as Record<string, unknown>;
  const lockedKeys = ["date", "matchId", "league", "teams", "heroImage"];
  for (const key of lockedKeys) {
    if (!deepEqual(englishFrontmatter[key], translatedFrontmatter[key])) {
      throw new Error(`Frontmatter field changed: ${key}`);
    }
  }
}

function ensureFigureParity(
  englishArticle: Record<string, unknown>,
  translatedArticle: Record<string, unknown>
): void {
  const englishFigures = (englishArticle.figures || []) as Record<string, unknown>[];
  const translatedFigures = (translatedArticle.figures || []) as Record<string, unknown>[];
  if (englishFigures.length !== translatedFigures.length) {
    throw new Error("Figure count changed in translation.");
  }
  for (let idx = 0; idx < englishFigures.length; idx += 1) {
    const englishFigure = englishFigures[idx];
    const translatedFigure = translatedFigures[idx];
    const lockedKeys = ["id", "src", "width", "height", "kind"];
    for (const key of lockedKeys) {
      if (!deepEqual(englishFigure[key], translatedFigure[key])) {
        throw new Error(`Figure field changed: ${key}`);
      }
    }
  }
}

function validateSchemaWithPython(article: Record<string, unknown>): void {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "goalgazer-"));
  const payloadPath = path.join(tempDir, "article.json");
  fs.writeFileSync(payloadPath, JSON.stringify(article));

  const script = [
    "import json, sys",
    "from jsonschema import validate",
    "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
    "data = json.load(open(sys.argv[2], encoding='utf-8'))",
    "validate(instance=data, schema=schema)",
  ].join("; ");

  const venvPython = process.platform === "win32"
    ? path.resolve(process.cwd(), "venv/Scripts/python.exe")
    : path.resolve(process.cwd(), "venv/bin/python");
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : "python";

  const result = spawnSync(pythonCmd, ["-c", script, schemaPath, payloadPath], {
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(`Schema validation failed: ${result.stderr || result.stdout}`);
  }
}

function collectEvidence(article: Record<string, unknown>): string[] {
  const evidence: string[] = [];
  const sections = (article.sections || []) as Record<string, unknown>[];
  for (const section of sections) {
    const claims = (section.claims || []) as Record<string, unknown>[];
    for (const claim of claims) {
      const items = (claim.evidence || []) as string[];
      evidence.push(...items);
    }
  }
  const playerNotes = (article.player_notes || []) as Record<string, unknown>[];
  for (const note of playerNotes) {
    const items = (note.evidence || []) as string[];
    evidence.push(...items);
  }
  return evidence;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }
  return false;
}
