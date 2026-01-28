#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { ensureMatchContentDir, findMatchContentFile, getGeneratedContentPath } from "./paths";
import { translateArticle } from "./translate";

async function main() {
  const args = process.argv.slice(2);
  const league = getArgValue(args, "--league", "epl");
  const season = getArgValue(args, "--season", "2023");
  const matchIdArg = getArgValue(args, "--matchId", "");
  const incremental = args.includes("--incremental") || !args.includes("--full");
  const pythonScript = path.resolve(__dirname, "../python/goalgazer/__main__.py");
  const fetchFixturesScript = path.resolve(__dirname, "../python/fetch_fixtures.py");
  const pythonCwd = path.resolve(__dirname, "../python");

  console.log("🚀 GoalGazer Pipeline Runner");
  console.log("================================\n");

  const matchId = matchIdArg || getLatestMatchId(league, season, fetchFixturesScript, pythonCwd);
  if (!matchId) {
    console.error("❌ Failed to resolve latest matchId.");
    process.exit(1);
  }

  const languageTargets = ["en", "zh", "ja"];
  const contentDir = ensureMatchContentDir(matchId);
  const existingLanguages = languageTargets.filter((lang) =>
    fs.existsSync(getGeneratedContentPath(matchId, lang))
  );

  if (incremental && existingLanguages.length === languageTargets.length) {
    console.log(`skip ${matchId} already generated`);
    process.exit(0);
  }

  if (!fs.existsSync(getGeneratedContentPath(matchId, "en"))) {
    const pythonResult = spawnSync(
      "python",
      [pythonScript, "--matchId", matchId, "--league", league],
      { stdio: "inherit", cwd: pythonCwd }
    );
    if (pythonResult.status !== 0) {
      console.error(`\n❌ Pipeline failed with exit code ${pythonResult.status}`);
      process.exit(pythonResult.status || 1);
    }
  }

  const englishSourcePath = findMatchContentFile(matchId);
  const englishContentPath = getGeneratedContentPath(matchId, "en");
  const englishPayloadPath = englishSourcePath || (fs.existsSync(englishContentPath) ? englishContentPath : null);
  if (!englishPayloadPath) {
    console.error(`❌ Unable to locate generated article for matchId ${matchId}.`);
    process.exit(1);
  }

  const englishPayload = JSON.parse(fs.readFileSync(englishPayloadPath, "utf-8"));
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(englishContentPath, JSON.stringify(englishPayload, null, 2));

  const generatedLanguages = ["en"];
  for (const lang of ["zh", "ja"] as const) {
    const langPath = getGeneratedContentPath(matchId, lang);
    if (fs.existsSync(langPath)) {
      generatedLanguages.push(lang);
      continue;
    }
    const translated = await translateArticle(englishPayload, lang);
    fs.writeFileSync(langPath, JSON.stringify(translated, null, 2));
    generatedLanguages.push(lang);
  }

  console.log("\n✅ Pipeline completed successfully");
  console.log(`MatchId: ${matchId}`);
  console.log(`Generated files: ${generatedLanguages.join(", ")}`);
  console.log(`Content dir: ${contentDir}`);
}

function getLatestMatchId(
  leagueCode: string,
  seasonValue: string,
  scriptPath: string,
  cwd: string
): string | null {
  const result = spawnSync(
    "python",
    [scriptPath, "--league", leagueCode, "--season", seasonValue, "--latest"],
    { encoding: "utf-8", cwd }
  );
  if (result.status !== 0) {
    console.error("❌ Failed to fetch latest matchId.");
    console.error(result.stderr);
    return null;
  }
  return (result.stdout || "").trim() || null;
}

function getArgValue(argsList: string[], flag: string, fallback: string): string {
  const idx = argsList.indexOf(flag);
  if (idx !== -1 && argsList[idx + 1]) {
    return argsList[idx + 1];
  }
  return fallback;
}

main().catch((error) => {
  console.error("❌ Pipeline failed:", error);
  process.exit(1);
});
