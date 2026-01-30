import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/lib/leagues";
import { fetchFixtures, fetchStandings, fetchTopScorers, fetchTopAssists } from "@/lib/apiFootball";
import { getT, normalizeLang } from "@/i18n";
import LeagueHeader from "@/components/league/LeagueHeader";
import FixturesPanel from "@/components/league/FixturesPanel";
import StandingsTable from "@/components/league/StandingsTable";
import LeadersPanel from "@/components/league/LeadersPanel";
import PointsProgressChart from "@/components/league/charts/PointsProgressChart";
import GoalsForAgainstChart from "@/components/league/charts/GoalsForAgainstChart";
import TopScorersChart from "@/components/league/charts/TopScorersChart";
import AdUnit from "@/components/AdUnit";
import { Metadata } from "next";

interface LeaguePageProps {
  params: { lang: string; league: string };
}

export async function generateMetadata({ params }: LeaguePageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const league = getLeagueBySlug(params.league);
  if (!league) return {};

  const { t } = await getT(lang);
  return {
    title: `${league.name} ${t("leagueDashboard.standings")} | GoalGazer`,
    description: `Track latest fixtures, standings, and player leaders for ${league.name} - ${league.season} season.`,
  };
}

export default async function LeagueDashboard({ params }: LeaguePageProps) {
  const lang = normalizeLang(params.lang);
  const { t } = await getT(lang);
  const league = getLeagueBySlug(params.league);

  if (!league) {
    notFound();
  }

  // Parallel fetching
  const [fixtures, standings, topScorers, topAssists] = await Promise.all([
    fetchFixtures(league.id, league.season),
    fetchStandings(league.id, league.season),
    fetchTopScorers(league.id, league.season),
    fetchTopAssists(league.id, league.season),
  ]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1680px", margin: "0 auto", minHeight: "100vh" }}>
      <LeagueHeader
        league={league}
        labels={{
          country: league.country,
          season: t("league.season")
        }}
      />

      {/* Grid Layout Container */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem"
      }}>

        {/* Charts Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem"
        }}>
          <PointsProgressChart standings={standings} title={t("leagueDashboard.standings")} />
          <GoalsForAgainstChart standings={standings} title={t("leagueDashboard.fixtures")} />
          <TopScorersChart data={topScorers} title={t("leagueDashboard.topScorers")} />
        </div>

        <AdUnit slot="9384756201" />

        {/* Main Dashboard Layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1fr)",
          gap: "2.5rem",
          alignItems: "start"
        }} className="dashboard-content-layout">

          <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{t("leagueDashboard.standings")}</h2>
            <StandingsTable
              standings={standings}
              labels={{
                rank: t("leagueDashboard.table.rank"),
                team: t("leagueDashboard.table.team"),
                played: t("leagueDashboard.table.played"),
                win: t("leagueDashboard.table.win"),
                draw: t("leagueDashboard.table.draw"),
                lose: t("leagueDashboard.table.lose"),
                goals: t("leagueDashboard.table.goals"),
                gd: t("leagueDashboard.table.gd"),
                points: t("leagueDashboard.table.points"),
                form: t("leagueDashboard.table.form"),
              }}
            />
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>{t("leagueDashboard.fixtures")}</h2>
              <FixturesPanel
                fixtures={fixtures}
                lang={lang}
                labels={{
                  upcoming: t("leagueDashboard.upcoming"),
                  recent: t("leagueDashboard.recent"),
                  live: t("leagueDashboard.live")
                }}
              />
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>{t("leagueDashboard.topScorers")}</h2>
              <LeadersPanel
                topScorers={topScorers}
                topAssists={topAssists}
                labels={{
                  topScorers: t("leagueDashboard.topScorers"),
                  topAssists: t("leagueDashboard.topAssists"),
                  goals: "Goals",
                  assists: t("leagueDashboard.topAssists"),
                  appearances: "Apps"
                }}
              />
            </div>
          </aside>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1024px) {
          .dashboard-content-layout { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
