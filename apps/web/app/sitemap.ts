import { loadIndex } from "../lib/content";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.goalgazer.example";
  const entries = loadIndex();

  return [
    { url: baseUrl, lastModified: new Date() },
    ...entries.map((entry) => ({
      url: `${baseUrl}/matches/${entry.matchId}`,
      lastModified: new Date(entry.date),
    })),
  ];
}
