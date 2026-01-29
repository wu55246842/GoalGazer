import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "../../..");
const contentRoot = path.join(repoRoot, "apps", "web", "content");
const contentMatchesDir = path.join(contentRoot, "matches");

export function ensureMatchContentDir(matchId: string): string {
  const target = path.join(contentMatchesDir, matchId);
  fs.mkdirSync(target, { recursive: true });
  return target;
}

export function getGeneratedContentPath(matchId: string, lang: string): string {
  return path.join(contentMatchesDir, matchId, `index.${lang}.json`);
}

export function findMatchContentFile(matchId: string): string | null {
  if (!fs.existsSync(contentMatchesDir)) {
    return null;
  }
  const entries = fs.readdirSync(contentMatchesDir);
  const target = entries.find((entry) => entry.endsWith(`_${matchId}.json`));
  if (!target) {
    return null;
  }
  return path.join(contentMatchesDir, target);
}

export function getMatchIllustrationPath(matchId: string): string {
  const publicMatchesDir = path.join(repoRoot, "apps", "web", "public", "generated", "matches");
  if (!fs.existsSync(publicMatchesDir)) {
    fs.mkdirSync(publicMatchesDir, { recursive: true });
  }
  return path.join(publicMatchesDir, `${matchId}.png`);
}
