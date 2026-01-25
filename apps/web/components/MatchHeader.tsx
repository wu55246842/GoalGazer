interface MatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  score: string;
  dateUtc: string;
  league: string;
  round: string;
  venue: string;
}

export default function MatchHeader({
  homeTeam,
  awayTeam,
  score,
  dateUtc,
  league,
  round,
  venue,
}: MatchHeaderProps) {
  return (
    <section className="card" style={{ marginTop: "1.5rem" }}>
      <h2>
        {homeTeam} {score} {awayTeam}
      </h2>
      <p>
        {league} · {round} · {new Date(dateUtc).toUTCString()}
      </p>
      <p>Venue: {venue}</p>
    </section>
  );
}
