import type { MetadataRoute } from "next";
import { readMatchIndex } from "@/lib/content";
import { buildLocalizedPath, SUPPORTED_LANGS } from "@/i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goalgazer.xyz";
  const { articles } = await readMatchIndex({ limit: 1000 });
  const entries = Array.isArray(articles) ? articles : [];
  const staticPaths = [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/sources",
    "/editorial-policy",
  ];

  const staticEntries = SUPPORTED_LANGS.flatMap((lang) =>
    staticPaths.map((path) => ({
      url: new URL(buildLocalizedPath(lang, path), baseUrl).toString(),
      lastModified: new Date(),
    }))
  );

  const leagueEntries = SUPPORTED_LANGS.flatMap((lang) =>
    entries.map((entry) => ({
      url: new URL(buildLocalizedPath(lang, `/leagues/${entry.league}`), baseUrl).toString(),
      lastModified: new Date(entry.date),
    }))
  );

  const matchEntries = SUPPORTED_LANGS.flatMap((lang) =>
    entries.map((entry) => ({
      url: new URL(buildLocalizedPath(lang, `/matches/${entry.slug}`), baseUrl).toString(),
      lastModified: new Date(entry.date),
    }))
  );

  return [...staticEntries, ...leagueEntries, ...matchEntries];
}
