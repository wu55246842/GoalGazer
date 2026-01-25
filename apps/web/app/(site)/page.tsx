import { loadIndex } from "../../lib/content";

export default function HomePage() {
  const articles = loadIndex();

  return (
    <div className="grid" style={{ gap: "2rem" }}>
      <section>
        <h1>GoalGazer</h1>
        <p>
          GoalGazer delivers data-backed tactical match breakdowns with original
          visuals, transparent sourcing, and editorial safeguards.
        </p>
      </section>
      <section className="grid two">
        {articles.map((article) => (
          <a key={article.matchId} href={`/matches/${article.matchId}`}>
            <div className="card">
              <p className="tag">{article.league}</p>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <p>{new Date(article.date).toUTCString()}</p>
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}
