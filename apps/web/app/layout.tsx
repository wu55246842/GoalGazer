import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "GoalGazer | Data-Driven Football Tactical Analysis",
    template: "%s | GoalGazer",
  },
  description:
    "GoalGazer delivers data-backed football tactical match breakdowns with original visualizations, transparent sourcing, and editorial safeguards. Explore in-depth analysis of Premier League matches.",
  metadataBase: new URL("https://www.goalgazer.example"),
  keywords: [
    "football analysis",
    "tactical breakdown",
    "match analysis",
    "football statistics",
    "Premier League",
    "football tactics",
    "data visualization",
  ],
  authors: [{ name: "GoalGazer Team" }],
  openGraph: {
    type: "website",
    title: "GoalGazer | Data-Driven Football Tactical Analysis",
    description:
      "Automated yet editorially guided tactical recaps powered by structured match data and original visuals.",
    siteName: "GoalGazer",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalGazer | Data-Driven Football Tactical Analysis",
    description:
      "Automated yet editorially guided tactical recaps powered by structured match data and original visuals.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="site-container">
          {/* Header */}
          <header className="site-header">
            <div className="container">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <a href="/" className="logo">
                  <span className="logo-icon">⚽</span>
                  <span className="logo-text">GoalGazer</span>
                </a>
                <nav className="nav">
                  <a href="/">Home</a>
                  <a href="/about">About</a>
                  <a href="/contact">Contact</a>
                  <a href="/privacy">Privacy</a>
                  <a href="/terms">Terms</a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="site-main">
            <div className="container">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="site-footer">
            <div className="container">
              <div className="footer-grid">
                {/* About Section */}
                <div>
                  <h3>About GoalGazer</h3>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
                    Data-driven football tactical analysis with transparent sourcing and original visualizations.
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)", marginTop: "0.75rem" }}>
                    Combining structured match data with editorial oversight to deliver insightful match breakdowns.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h4>Quick Links</h4>
                  <ul className="footer-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                    <li><a href="/sources">Data Sources</a></li>
                  </ul>
                </div>

                {/* Legal */}
                <div>
                  <h4>Legal</h4>
                  <ul className="footer-links">
                    <li><a href="/privacy">Privacy Policy</a></li>
                    <li><a href="/terms">Terms of Service</a></li>
                    <li><a href="/editorial-policy">Editorial Policy</a></li>
                  </ul>
                </div>

                {/* Follow Us */}
                <div>
                  <h4>Follow Us</h4>
                  <p style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>
                    Stay updated with the latest tactical insights
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <a href="#" className="social-link">Twitter</a>
                    <a href="#" className="social-link">GitHub</a>
                  </div>
                </div>
              </div>

              {/* Footer Bottom */}
              <div className="footer-bottom">
                <p>© {currentYear} GoalGazer. All rights reserved.</p>
                <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
                  All match data and statistics are sourced from licensed providers. Visualizations and analysis are original content.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
