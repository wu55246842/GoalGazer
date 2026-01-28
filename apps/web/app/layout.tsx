import "./globals.css";
import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, normalizeLang } from "@/i18n";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerLang = headers().get("x-goalgazer-lang");
  const cookieLang = cookies().get("GG_LANG")?.value;
  const lang = normalizeLang(headerLang ?? cookieLang ?? DEFAULT_LANG);

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
