import { loadIndex } from "../../../../lib/content";

interface LeaguePageProps {
  params: { league: string };
}

export default function LeaguePage({ params }: LeaguePageProps) {
  const entries = loadIndex().filter(
    (entry) => entry.league.toLowerCase() === params.league.toLowerCase()
  );

  return (
    <section>
      <h1>{params.league.toUpperCase()} Match Reviews</h1>
      <div className="grid two">
        {entries.map((article) => (
          <a key={article.matchId} href={`/matches/${article.matchId}`}>
            <div className="card">
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <p>{new Date(article.date).toUTCString()}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
