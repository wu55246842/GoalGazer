import ShareBar from "./ShareBar";

interface ArticleLayoutProps {
  title: string;
  description: string;
  tagLabel: string;
  shareLabel: string;
  shareLinks: { href: string; label: string }[];
  children: React.ReactNode;
}

export default function ArticleLayout({
  title,
  description,
  tagLabel,
  shareLabel,
  shareLinks,
  children,
}: ArticleLayoutProps) {
  return (
    <article>
      <header className="card">
        <p className="tag">{tagLabel}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <ShareBar label={shareLabel} links={shareLinks} />
      </header>
      <div>{children}</div>
    </article>
  );
}
