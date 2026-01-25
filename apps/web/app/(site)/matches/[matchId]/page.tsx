import { notFound } from "next/navigation";
import ArticleLayout from "../../../../components/ArticleLayout";
import MatchHeader from "../../../../components/MatchHeader";
import ChartFigure from "../../../../components/ChartFigure";
import {
  buildArticleMetadata,
  buildBreadcrumbJsonLd,
  buildJsonLd,
} from "../../../../lib/seo";
import { loadArticle, listMatchIds } from "../../../../lib/content";

interface MatchPageProps {
  params: { matchId: string };
}

export async function generateStaticParams() {
  return listMatchIds().map((matchId) => ({ matchId }));
}

export function generateMetadata({ params }: MatchPageProps) {
  const article = loadArticle(params.matchId);
  if (!article) {
    return {};
  }
  return buildArticleMetadata(article);
}

export default function MatchPage({ params }: MatchPageProps) {
  const article = loadArticle(params.matchId);

  if (!article) {
    notFound();
  }

  const articleJsonLd = buildJsonLd(article);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(article);

  return (
    <ArticleLayout
      title={article.frontmatter.title}
      description={article.frontmatter.description}
    >
      <MatchHeader
        homeTeam={article.match.homeTeam}
        awayTeam={article.match.awayTeam}
        score={article.match.score}
        dateUtc={article.match.date_utc}
        league={article.match.league}
        round={article.match.round}
        venue={article.match.venue}
      />
      {article.sections.map((section) => (
        <section key={section.heading} style={{ marginTop: "2rem" }}>
          <h2>{section.heading}</h2>
          {section.bullets && (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.figures.map((figure) => (
            <ChartFigure key={figure.src} {...figure} />
          ))}
          {section.claims?.map((claim) => (
            <details key={claim.claim} style={{ marginTop: "1rem" }}>
              <summary>{claim.claim}</summary>
              <p>Confidence: {Math.round(claim.confidence * 100)}%</p>
              <ul>
                {claim.evidence.map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      ))}
      <section style={{ marginTop: "2rem" }}>
        <h2>Player Notes</h2>
        <div className="grid two">
          {article.player_notes.map((note) => (
            <div className="card" key={note.player}>
              <h3>{note.player}</h3>
              <p>{note.summary}</p>
              <p>Team: {note.team}</p>
              <p>Rating: {note.rating}</p>
              <ul>
                {note.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section style={{ marginTop: "2rem" }}>
        <h2>Data Limitations</h2>
        <ul>
          {article.data_limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <footer>
        <p>{article.cta}</p>
        <p>Data citations: {article.data_citations.join(" · ")}</p>
        <p>
          <a href="/sources">Data Sources</a> · {" "}
          <a href="/editorial-policy">Editorial Policy</a>
        </p>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </ArticleLayout>
  );
}
