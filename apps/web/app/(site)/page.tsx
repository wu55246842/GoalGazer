import { loadIndex } from "../../lib/content";

export default function HomePage() {
  const articles = loadIndex();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>Data-Driven Football Tactical Analysis</h1>
        <p>
          Explore in-depth match breakdowns powered by structured data,
          original visualizations, and transparent editorial standards.
          Every insight backed by evidence.
        </p>
        <div className="flex justify-center gap-md" style={{ marginTop: "2rem" }}>
          <a href="#matches" className="btn btn-primary">
            View Latest Matches
          </a>
          <a href="/about" className="btn btn-outline">
            Learn More
          </a>
        </div>
      </section>

      {/* Featured Matches Section */}
      <section id="matches">
        <div className="flex justify-between items-center mb-xl">
          <div>
            <h2 style={{ marginBottom: "0.5rem" }}>Latest Tactical Reviews</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 0 }}>
              {articles.length} match{articles.length !== 1 ? "es" : ""} analyzed with data-backed insights
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="card text-center" style={{ padding: "3rem" }}>
            <h3>No matches available yet</h3>
            <p>Check back soon for tactical analysis of the latest matches.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {articles.map((article, index) => (
              <a
                key={article.matchId}
                href={`/matches/${article.matchId}`}
                className="card card-interactive fade-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  textDecoration: "none",
                }}
              >
                <div className="flex justify-between items-center mb-md">
                  <span className="tag">{article.league}</span>
                  <time
                    dateTime={article.date}
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text-light)",
                    }}
                  >
                    {new Date(article.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>

                <h3
                  style={{
                    marginBottom: "0.75rem",
                    fontSize: "1.25rem",
                    color: "var(--color-text)",
                  }}
                >
                  {article.title}
                </h3>

                <p
                  style={{
                    color: "var(--color-text-muted)",
                    lineHeight: "1.6",
                    marginBottom: "1rem",
                  }}
                >
                  {article.description}
                </p>

                <div
                  className="flex items-center gap-sm"
                  style={{
                    color: "var(--color-primary)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                  }}
                >
                  Read Analysis
                  <span style={{ fontSize: "1.125rem" }}>→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Ad Placeholder */}
      <div className="ad-container" style={{ marginTop: "3rem" }}>
        <div className="ad-placeholder">Advertisement</div>
      </div>

      {/* CTA Section */}
      <section
        className="card text-center"
        style={{
          marginTop: "3rem",
          background: "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary-light) 100%)",
          border: "none",
        }}
      >
        <h2>Stay Updated with Latest Analysis</h2>
        <p style={{ maxWidth: "600px", margin: "0 auto 1.5rem" }}>
          Get notified when new tactical breakdowns are published. Never miss
          an in-depth match analysis.
        </p>
        <a href="/contact" className="btn btn-primary">
          Get in Touch
        </a>
      </section>
    </div>
  );
}
