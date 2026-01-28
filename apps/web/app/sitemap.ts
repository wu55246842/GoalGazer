import { loadIndex } from "../lib/content";
import { supportedLanguages } from "../i18n";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.goalgazer.example";
  const entries = loadIndex();
  const staticPaths = ["/", "/about", "/contact", "/privacy", "/terms", "/sources", "/editorial-policy"];

  const staticEntries = supportedLanguages.flatMap((lang) =>
    staticPaths.map((path) => ({
      url: `${baseUrl}/${lang}${path === "/" ? "" : path}`,
      lastModified: new Date(),
    }))
  );

  const leagueEntries = supportedLanguages.flatMap((lang) =>
    entries.map((entry) => ({
      url: `${baseUrl}/${lang}/leagues/${entry.league}`,
      lastModified: new Date(entry.date),
    }))
  );

  const matchEntries = supportedLanguages.flatMap((lang) =>
    entries.map((entry) => ({
      url: `${baseUrl}/${lang}/matches/${entry.matchId}`,
      lastModified: new Date(entry.date),
    }))
  );

  return [...staticEntries, ...leagueEntries, ...matchEntries];
}
