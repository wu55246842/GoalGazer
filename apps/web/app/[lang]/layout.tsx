import type { Metadata } from "next";
import "../globals.css";
import SiteHeader from "../../components/SiteHeader";
import { I18nProvider } from "@/i18n/I18nProvider";
import {
  buildLocalizedPath,
  getMessages,
  getT,
  normalizeLang,
  SUPPORTED_LANGS,
} from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import CookieConsent from "../../components/CookieConsent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.goalgazer.example";

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const messages = await getMessages(lang);

  return {
    title: {
      default: messages.seo.siteTitle,
      template: `%s | ${messages.common.brandName}`,
    },
    description: messages.seo.siteDescription,
    metadataBase: new URL(siteUrl),
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
      canonical: buildCanonicalUrl(lang, "/"),
      languages: buildLanguageAlternates("/"),
    },
    icons: {
      icon: "/favicon-raw.png",
      apple: "/favicon-raw.png",
    },
  };
}

export async function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/daily", label: t("nav.daily") },
    { href: "/leagues", label: t("leagues.overviewTitle") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <I18nProvider lang={lang} messages={messages}>
      <div className="site-container">
        <SiteHeader
          lang={lang}
          brandName={t("common.brandName")}
          navLinks={navLinks}
        />

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
                    <a href={buildLocalizedPath(lang, "/")}>{t("nav.home")}</a>
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
                    <a href={buildLocalizedPath(lang, "/editorial-policy")}>{t("nav.editorialPolicy")}</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4>{t("footer.followUs")}</h4>
                <p style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>
                  {t("footer.followDescription")}
                </p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {/* Social links removed until real accounts are provided to avoid "Broken Navigation" policy violations */}
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
        <CookieConsent />
      </div>
    </I18nProvider>
  );
}
