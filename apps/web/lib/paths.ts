import path from "path";

export const repoRoot = path.resolve(process.cwd(), "..", "..");
export const contentRoot = path.join(repoRoot, "apps", "web", "content");

export const contentPaths = {
  matches: path.join(contentRoot, "matches"),
  leagues: path.join(contentRoot, "leagues"),
  index: path.join(contentRoot, "index.json"),
};
