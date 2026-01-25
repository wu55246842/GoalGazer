export default function ShareBar() {
  return (
    <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>
      <span>Share: </span>
      <a href="https://x.com/intent/tweet" target="_blank" rel="noreferrer">
        X
      </a>
      {" · "}
      <a href="https://www.linkedin.com/shareArticle" target="_blank" rel="noreferrer">
        LinkedIn
      </a>
    </div>
  );
}
