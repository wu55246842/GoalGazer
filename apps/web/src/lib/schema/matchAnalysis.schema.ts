import { z } from "zod";

const playerRowSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  minutes: z.number().nullable().optional(),
  goals: z.number().nullable().optional(),
  assists: z.number().nullable().optional(),
  yellow: z.number().nullable().optional(),
  red: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  shots: z.number().nullable().optional(),
  key_passes: z.number().nullable().optional(),
  passes: z.number().nullable().optional(),
  tackles: z.number().nullable().optional(),
  duels_won: z.number().nullable().optional(),
});

const timelineSchema = z.object({
  minute: z.number(),
  type: z.enum(["goal", "card", "subst", "var", "other"]),
  teamId: z.string().optional(),
  teamName: z.string().optional(),
  playerId: z.string().optional(),
  playerName: z.string().optional(),
  assistId: z.string().nullable().optional(),
  assistName: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
  score_after: z
    .object({
      home: z.number(),
      away: z.number(),
    })
    .nullable()
    .optional(),
});

const normalizedStatsSchema = z.object({
  possession: z.number().nullable().optional(),
  total_shots: z.number().nullable().optional(),
  shots_on_target: z.number().nullable().optional(),
  corners: z.number().nullable().optional(),
  fouls: z.number().nullable().optional(),
  yellow_cards: z.number().nullable().optional(),
  red_cards: z.number().nullable().optional(),
  offsides: z.number().nullable().optional(),
  passes_total: z.number().nullable().optional(),
  pass_accuracy: z.number().nullable().optional(),
});

const figureSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string(),
  caption: z.string(),
  width: z.number(),
  height: z.number(),
  kind: z.enum(["stats_comparison", "timeline", "pass_network", "shot_proxy", "other"]),
});

const claimSchema = z.object({
  claim: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const sectionSchema = z.object({
  heading: z.string(),
  paragraphs: z.array(z.string()),
  bullets: z.array(z.string()).optional(),
  claims: z.array(claimSchema).optional(),
});

const playerNoteSchema = z.object({
  player: z.string(),
  team: z.string(),
  summary: z.string(),
  evidence: z.array(z.string()),
  rating: z.string().optional(),
});

export const matchAnalysisSchema = z.object({
  frontmatter: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().datetime(),
    matchId: z.string(),
    league: z.string(),
    teams: z.tuple([z.string(), z.string()]),
    tags: z.array(z.string()),
    heroImage: z.string().optional(),
  }),
  match: z.object({
    id: z.string(),
    date_utc: z.string().datetime(),
    league: z.string(),
    season: z.string(),
    round: z.string().optional(),
    homeTeam: z.object({
      id: z.string().optional(),
      name: z.string(),
    }),
    awayTeam: z.object({
      id: z.string().optional(),
      name: z.string(),
    }),
    score: z.object({
      home: z.number(),
      away: z.number(),
      ht_home: z.number().optional(),
      ht_away: z.number().optional(),
    }),
    venue: z.string().optional(),
  }),
  data_provenance: z.object({
    provider: z.literal("api-football"),
    endpoints_used: z.array(z.string()),
    fetched_at_utc: z.string().datetime(),
    availability: z.object({
      has_events: z.boolean(),
      has_statistics: z.boolean(),
      has_lineups: z.boolean(),
      has_players: z.boolean(),
      has_xg: z.boolean(),
      has_shot_locations: z.boolean(),
    }),
    notes: z.array(z.string()).optional(),
  }),
  timeline: z.array(timelineSchema),
  team_stats: z.object({
    raw: z.unknown().optional(),
    normalized: z.record(normalizedStatsSchema),
  }),
  players: z
    .object({
      home: z.array(playerRowSchema),
      away: z.array(playerRowSchema),
    })
    .optional(),
  figures: z.array(figureSchema),
  sections: z.array(sectionSchema),
  player_notes: z.array(playerNoteSchema),
  data_limitations: z.array(z.string()),
  cta: z.string(),
});

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;
