import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "../../..");
const contentMatchesDir = path.join(repoRoot, "apps", "web", "content", "matches");
const generatedMatchesDir = path.join(repoRoot, "apps", "web", "public", "generated", "matches");

export function ensureMatchContentDir(matchId: string): string {
  const target = path.join(generatedMatchesDir, matchId, "content");
  fs.mkdirSync(target, { recursive: true });
  return target;
}

export function getGeneratedContentPath(matchId: string, lang: string): string {
  return path.join(generatedMatchesDir, matchId, "content", `${lang}.json`);
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
