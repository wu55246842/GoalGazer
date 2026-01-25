import ShareBar from "./ShareBar";

interface ArticleLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ArticleLayout({
  title,
  description,
  children,
}: ArticleLayoutProps) {
  return (
    <article>
      <header className="card">
        <p className="tag">Tactical Review</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <ShareBar />
      </header>
      <div>{children}</div>
    </article>
  );
}
