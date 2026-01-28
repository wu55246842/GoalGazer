"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { languageLabels, supportedLanguages, type SupportedLanguage } from "../lib/i18n";

interface LanguageSwitcherProps {
  currentLanguage: SupportedLanguage;
  label: string;
}

export default function LanguageSwitcher({ currentLanguage, label }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("lang")) {
      const saved = window.localStorage.getItem("goalgazer-lang");
      if (saved && supportedLanguages.includes(saved as SupportedLanguage)) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lang", saved);
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [pathname, router, searchParams]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = event.target.value as SupportedLanguage;
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", lang);
    window.localStorage.setItem("goalgazer-lang", lang);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
        {label}
      </span>
      <select
        value={currentLanguage}
        onChange={handleChange}
        style={{
          padding: "0.4rem 0.6rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "white",
          fontWeight: 600,
        }}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {languageLabels[lang]}
          </option>
        ))}
      </select>
    </label>
  );
}
