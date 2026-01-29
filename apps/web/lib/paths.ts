import path from "path";

export const repoRoot = path.resolve(process.cwd(), "..", "..");
export const contentRoot = path.join(repoRoot, "apps", "web", "content");
export const generatedMatchesRoot = path.join(
  repoRoot,
  "apps",
  "web",
  "public",
  "generated",
  "matches"
);

export const contentPaths = {
  matches: path.join(contentRoot, "matches"),
  leagues: path.join(contentRoot, "leagues"),
  index: path.join(contentRoot, "index.json"),
};

export const generatedContentPaths = {
  matches: generatedMatchesRoot,
  matchContentDir: (matchId: string) =>
    path.join(contentPaths.matches, matchId),
  matchContentFile: (matchId: string, lang: string) =>
    path.join(contentPaths.matches, matchId, `index.${lang}.json`),
};
