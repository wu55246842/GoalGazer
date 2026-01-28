import ShareBar from "./ShareBar";

interface ArticleLayoutProps {
  title: string;
  description: string;
  tagLabel?: string;
  shareLabel?: string;
  children: React.ReactNode;
}

export default function ArticleLayout({
  title,
  description,
  tagLabel = "Tactical Review",
  shareLabel = "Share",
  children,
}: ArticleLayoutProps) {
  return (
    <article>
      <header className="card">
        <p className="tag">{tagLabel}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <ShareBar label={shareLabel} />
      </header>
      <div>{children}</div>
    </article>
  );
}
