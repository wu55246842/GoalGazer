import en from "./messages/en";
import zh from "./messages/zh";
import ja from "./messages/ja";

export type SupportedLanguage = "en" | "zh" | "ja";

export const supportedLanguages: SupportedLanguage[] = ["en", "zh", "ja"];
export const defaultLanguage: SupportedLanguage = "en";

export const languageLabels: Record<SupportedLanguage, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export type Messages = typeof en;

const dictionaries: Record<SupportedLanguage, Messages> = {
  en,
  zh,
  ja,
};

export function normalizeLanguage(lang?: string | null): SupportedLanguage {
  if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  return defaultLanguage;
}

export function getMessages(lang: SupportedLanguage): Messages {
  return dictionaries[lang] ?? en;
}

export function createTranslator(messages: Messages, lang: SupportedLanguage) {
  return (key: string, params?: Record<string, string | number>): string => {
    const value = resolveKey(messages, key) ?? resolveKey(en, key);
    if (value === undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing translation key: ${key} (${lang})`);
      }
      return key;
    }
    if (typeof value !== "string") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Translation key is not a string: ${key} (${lang})`);
      }
      return String(value);
    }
    return interpolate(value, params);
  };
}

export function buildLocalizedPath(lang: SupportedLanguage, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${lang}`;
  }
  if (normalized === `/${lang}` || normalized.startsWith(`/${lang}/`)) {
    return normalized;
  }
  return `/${lang}${normalized}`;
}

export function replaceLanguageInPath(pathname: string, lang: SupportedLanguage): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && supportedLanguages.includes(segments[1] as SupportedLanguage)) {
    segments[1] = lang;
    return segments.join("/") || "/";
  }
  return buildLocalizedPath(lang, pathname);
}

export function getPreferredLanguage(acceptLanguageHeader?: string | null): SupportedLanguage {
  if (!acceptLanguageHeader) {
    return defaultLanguage;
  }
  const lowered = acceptLanguageHeader.toLowerCase();
  if (lowered.includes("zh")) {
    return "zh";
  }
  if (lowered.includes("ja")) {
    return "ja";
  }
  return defaultLanguage;
}

function resolveKey(messages: Messages, key: string): string | undefined {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages) as string | undefined;
}

function interpolate(value: string, params?: Record<string, string | number>): string {
  if (!params) {
    return value;
  }
  return value.replace(/\{(\w+)\}/g, (_match, key) => {
    const replacement = params[key];
    return replacement !== undefined ? String(replacement) : `{${key}}`;
  });
}
