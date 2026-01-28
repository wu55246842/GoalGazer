import type { Metadata } from "next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { I18nProvider } from "../../i18n/I18nProvider";
import {
  buildLocalizedPath,
  createTranslator,
  getMessages,
  normalizeLanguage,
  supportedLanguages,
} from "../../i18n";

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);

  return {
    title: {
      default: messages.seo.siteTitle,
      template: `%s | ${messages.common.brandName}`,
    },
    description: messages.seo.siteDescription,
    metadataBase: new URL("https://www.goalgazer.example"),
    keywords: messages.seo.keywords,
    authors: [{ name: messages.seo.author }],
    openGraph: {
      type: "website",
      title: messages.seo.siteTitle,
      description: messages.seo.siteTagline,
      siteName: messages.common.brandName,
      locale: messages.formats.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.seo.siteTitle,
      description: messages.seo.siteTagline,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      languages: {
        en: buildLocalizedPath("en", "/"),
        zh: buildLocalizedPath("zh", "/"),
        ja: buildLocalizedPath("ja", "/"),
      },
    },
  };
}

export async function generateStaticParams() {
  return supportedLanguages.map((lang) => ({ lang }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/privacy", label: t("nav.privacy") },
    { href: "/terms", label: t("nav.terms") },
  ];

  return (
    <I18nProvider lang={lang} messages={messages}>
      <div className="site-container">
        <header className="site-header">
          <div className="container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <a href={buildLocalizedPath(lang, "/")} className="logo">
                <span className="logo-icon">⚽</span>
                <span className="logo-text">{t("common.brandName")}</span>
              </a>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <nav className="nav">
                  {navLinks.map((link) => (
                    <a key={link.href} href={buildLocalizedPath(lang, link.href)}>
                      {link.label}
                    </a>
                  ))}
                </nav>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </header>

        <main className="site-main">
          <div className="container">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <h3>{t("footer.aboutTitle")}</h3>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
                  {t("footer.aboutDescription")}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginTop: "0.75rem",
                  }}
                >
                  {t("footer.aboutSubtext")}
                </p>
              </div>

              <div>
                <h4>{t("footer.quickLinks")}</h4>
                <ul className="footer-links">
                  <li>
                    <a href={buildLocalizedPath(lang, "/")}>
                      {t("nav.home")}
                    </a>
                  </li>
                  <li>
                    <a href={buildLocalizedPath(lang, "/about")}>{t("nav.about")}</a>
                  </li>
                  <li>
                    <a href={buildLocalizedPath(lang, "/contact")}>{t("nav.contact")}</a>
                  </li>
                  <li>
                    <a href={buildLocalizedPath(lang, "/sources")}>{t("nav.sources")}</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4>{t("footer.legal")}</h4>
                <ul className="footer-links">
                  <li>
                    <a href={buildLocalizedPath(lang, "/privacy")}>{t("nav.privacy")}</a>
                  </li>
                  <li>
                    <a href={buildLocalizedPath(lang, "/terms")}>{t("nav.terms")}</a>
                  </li>
                  <li>
                    <a href={buildLocalizedPath(lang, "/editorial-policy")}>
                      {t("nav.editorialPolicy")}
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4>{t("footer.followUs")}</h4>
                <p style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>
                  {t("footer.followDescription")}
                </p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <a href="#" className="social-link">
                    {t("footer.social.twitter")}
                  </a>
                  <a href="#" className="social-link">
                    {t("footer.social.github")}
                  </a>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>
                © {currentYear} {t("common.brandName")}. {t("footer.rights")}
              </p>
              <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
                {t("footer.dataNotice")}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </I18nProvider>
  );
}
