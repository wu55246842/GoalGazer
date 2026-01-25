export default function SourcesPage() {
  return (
    <section className="card">
      <h1>Data Sources</h1>
      <p>
        GoalGazer relies on licensed match data providers. The default pipeline
        connects to API-Football (API-FOOTBALL) when credentials are available.
      </p>
      <ul>
        <li>Match fixtures, lineups, and events via API-Football.</li>
        <li>Derived metrics computed locally from event data.</li>
        <li>Original visualizations generated with mplsoccer and matplotlib.</li>
      </ul>
      <p>
        Data limitations or missing fields are explicitly listed within each
        article.
      </p>
    </section>
  );
}
