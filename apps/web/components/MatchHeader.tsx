interface MatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  score: string;
  dateUtc: string;
  league: string;
  round: string;
  venue: string;
  labels: {
    venue: string;
    kickoff: string;
    status: string;
    fullTime: string;
  };
  locale: string;
}

export default function MatchHeader({
  homeTeam,
  awayTeam,
  score,
  dateUtc,
  league,
  round,
  venue,
  labels,
  locale,
}: MatchHeaderProps) {
  const [homeScore, awayScore] = score.split("-").map((s) => s.trim());
  const matchDate = new Date(dateUtc);

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* League and Round Info */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)",
          padding: "0.5rem 1rem",
          background: "var(--color-bg-alt)",
          borderRadius: "var(--radius-full)",
        }}>
          <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{league}</span>
          <span>•</span>
          <span>{round}</span>
          <span>•</span>
          <span>{matchDate.toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}</span>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="card" style={{
        background: "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary-light) 100%)",
        border: "none",
        padding: "3rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative Background Pattern */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              var(--color-primary) 50px,
              var(--color-primary) 51px
            )
          `,
          pointerEvents: "none",
        }} />

        {/* Score Display */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "3rem",
          position: "relative",
          zIndex: 1,
          flexWrap: "wrap",
        }}>
          {/* Home Team */}
          <div style={{
            flex: "1 1 200px",
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "1rem",
          }}>
            {/* Team Badge Placeholder */}
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-lg)",
              fontSize: "2rem",
              fontWeight: 900,
              color: "var(--color-primary)",
              border: "3px solid white",
            }}>
              {homeTeam.substring(0, 1)}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 800,
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
            }}>
              {homeTeam}
            </h2>
          </div>

          {/* Score */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            padding: "1.5rem 2.5rem",
            background: "white",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-2xl)",
          }}>
            <div style={{
              fontSize: "clamp(3rem, 8vw, 4.5rem)",
              fontWeight: 900,
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
              lineHeight: 1,
            }}>
              {homeScore}
            </div>
            <div style={{
              fontSize: "2rem",
              fontWeight: 300,
              color: "var(--color-text-muted)",
            }}>
              -
            </div>
            <div style={{
              fontSize: "clamp(3rem, 8vw, 4.5rem)",
              fontWeight: 900,
              fontFamily: "var(--font-heading)",
              color: "var(--color-secondary)",
              lineHeight: 1,
            }}>
              {awayScore}
            </div>
          </div>

          {/* Away Team */}
          <div style={{
            flex: "1 1 200px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "1rem",
          }}>
            {/* Team Badge Placeholder */}
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-lg)",
              fontSize: "2rem",
              fontWeight: 900,
              color: "var(--color-secondary)",
              border: "3px solid white",
            }}>
              {awayTeam.substring(0, 1)}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 800,
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
            }}>
              {awayTeam}
            </h2>
          </div>
        </div>

        {/* Match Info */}
        <div style={{
          marginTop: "2.5rem",
          display: "flex",
          justifyContent: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{
            padding: "0.75rem 1.5rem",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "var(--shadow-sm)",
          }}>
            <span style={{ fontSize: "1.25rem" }}>📍</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-light)", fontWeight: 500 }}>
                {labels.venue}
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)" }}>
                {venue}
              </div>
            </div>
          </div>

          <div style={{
            padding: "0.75rem 1.5rem",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "var(--shadow-sm)",
          }}>
            <span style={{ fontSize: "1.25rem" }}>🕐</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-light)", fontWeight: 500 }}>
                {labels.kickoff}
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)" }}>
                {matchDate.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short"
                })}
              </div>
            </div>
          </div>

          <div style={{
            padding: "0.75rem 1.5rem",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "var(--shadow-sm)",
          }}>
            <span style={{ fontSize: "1.25rem" }}>⚽</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-light)", fontWeight: 500 }}>
                {labels.status}
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-success)" }}>
                {labels.fullTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
