import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { generateText } from "../../../apps/web/lib/pollinations";

type SupportedLanguage = "zh" | "ja";

const TRANSLATABLE_PATHS = [
  "frontmatter.title",
  "frontmatter.description",
  "sections[].heading",
  "sections[].paragraphs[]",
  "sections[].bullets[]",
  "sections[].claims[].claim",
  "player_notes[].summary",
  "figures[].alt",
  "figures[].caption",
  "data_limitations[]",
  "cta",
];

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  zh: "Simplified Chinese",
  ja: "Japanese",
};

const schemaPath = path.resolve(__dirname, "../python/goalgazer/schema_match_analysis.json");

export async function translateArticle(
  englishArticle: Record<string, unknown>,
  targetLanguage: SupportedLanguage
): Promise<Record<string, unknown>> {
  const attemptLimit = 2;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
    try {
      const payload = await requestTranslation(englishArticle, targetLanguage, attempt);
      validateTranslation(englishArticle, payload);
      return payload;
    } catch (error) {
      lastError = error as Error;
      if (attempt < attemptLimit) {
        console.warn(`⚠️ Translation validation failed. Retrying (${attempt}/${attemptLimit})...`);
      }
    }
  }
  throw lastError ?? new Error("Translation failed.");
}

async function requestTranslation(
  englishArticle: Record<string, unknown>,
  targetLanguage: SupportedLanguage,
  attempt: number
): Promise<Record<string, unknown>> {
  const retryNote =
    attempt > 1
      ? "Retry: output JSON only, preserve ALL non-translated fields exactly, no deviations."
      : "";
  const systemPrompt = [
    "You are a professional football match analyst and translator.",
    "Translate ONLY the specified text fields from English into the target language.",
    "Preserve all factual data, IDs, numeric values, timestamps, and arrays exactly.",
    "Do NOT translate player names, team names, league names, or identifiers.",
    "Do NOT edit evidence strings, IDs, image paths, or statistical values.",
    "Do NOT add or remove fields; keep the JSON structure identical.",
    "If a field is empty or null, keep it empty.",
    "Output MUST be strict JSON only (no markdown, no comments).",
    "Tone: professional, accurate, sports analytics style.",
    `Allowed fields to translate: ${TRANSLATABLE_PATHS.join(", ")}`,
    retryNote,
  ].join("\n");

  const userPrompt = JSON.stringify({
    target_language: LANGUAGE_LABELS[targetLanguage],
    retry_attempt: attempt,
    translation_rules: {
      keep_names_unchanged: true,
      translate_only_paths: TRANSLATABLE_PATHS,
      keep_structure: true,
    },
    source_json: englishArticle,
  });

  const responseText = await generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "nova-fast",
    jsonMode: true,
  });

  return JSON.parse(responseText);
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
  const factKeys = ["match", "timeline", "team_stats", "players", "data_provenance"];
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
  const lockedKeys = ["date", "matchId", "league", "teams", "tags", "heroImage"];
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
    "schema = json.load(open(sys.argv[1]))",
    "data = json.load(open(sys.argv[2]))",
    "validate(instance=data, schema=schema)",
  ].join("; ");

  const result = spawnSync("python", ["-c", script, schemaPath, payloadPath], {
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
