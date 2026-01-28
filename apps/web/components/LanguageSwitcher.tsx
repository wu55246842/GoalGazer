"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { languageLabels, replaceLanguageInPath, supportedLanguages } from "../i18n";
import { useLang, useT } from "../i18n/I18nProvider";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    const stored = window.localStorage.getItem("goalgazer-lang");
    if (stored && stored !== lang && supportedLanguages.includes(stored as typeof lang)) {
      const target = replaceLanguageInPath(pathname, stored as typeof lang);
      router.replace(buildQueryPath(target, searchParams.toString()));
    }
  }, [lang, pathname, router, searchParams]);

  useEffect(() => {
    window.localStorage.setItem("goalgazer-lang", lang);
  }, [lang]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLang = event.target.value as typeof lang;
    const target = replaceLanguageInPath(pathname, nextLang);
    window.localStorage.setItem("goalgazer-lang", nextLang);
    document.cookie = `GG_LANG=${nextLang}; path=/; max-age=31536000; samesite=lax`;
    router.replace(buildQueryPath(target, searchParams.toString()));
  };

  return (
    <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
        {t("common.languageLabel")}
      </span>
      <select
        value={lang}
        onChange={handleChange}
        style={{
          padding: "0.4rem 0.6rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "white",
          fontWeight: 600,
        }}
      >
        {supportedLanguages.map((option) => (
          <option key={option} value={option}>
            {languageLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildQueryPath(pathname: string, queryString: string) {
  if (!queryString) {
    return pathname;
  }
  return `${pathname}?${queryString}`;
}
