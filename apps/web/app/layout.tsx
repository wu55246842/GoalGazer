import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "GoalGazer | Tactical Match Breakdowns",
    template: "%s | GoalGazer",
  },
  description:
    "GoalGazer produces data-backed football tactical reviews with original visuals and transparent sourcing.",
  metadataBase: new URL("https://www.goalgazer.example"),
  openGraph: {
    type: "website",
    title: "GoalGazer | Tactical Match Breakdowns",
    description:
      "Automated yet editorially guided tactical recaps powered by structured match data and original visuals.",
    siteName: "GoalGazer",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalGazer | Tactical Match Breakdowns",
    description:
      "Automated yet editorially guided tactical recaps powered by structured match data and original visuals.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <div className="nav">
            <a href="/" aria-label="GoalGazer home">
              <strong>GoalGazer</strong>
            </a>
            <nav className="nav-links">
              <a href="/about">About</a>
              <a href="/sources">Data Sources</a>
              <a href="/editorial-policy">Editorial Policy</a>
              <a href="/privacy">Privacy</a>
              <a href="/contact">Contact</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
