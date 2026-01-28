import enMessages from "./messages/en.json";
import zhMessages from "./messages/zh.json";
import jaMessages from "./messages/ja.json";

export type Lang = "en" | "zh" | "ja";

export const SUPPORTED_LANGS = ["en", "zh", "ja"] as const;
export const DEFAULT_LANG: Lang = "en";

export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export type Messages = typeof enMessages;

type NonArrayObject = Record<string, unknown>;

type NestedMessageKey<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends NonArrayObject
      ? T[K] extends Array<unknown>
        ? never
        : `${K}.${NestedMessageKey<T[K]>}`
      : never;
}[keyof T & string];

export type MessageKey = NestedMessageKey<Messages>;

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

const dictionaries: Record<Lang, Messages> = {
  en: enMessages,
  zh: zhMessages,
  ja: jaMessages,
};

export function isLang(value?: string | null): value is Lang {
  return SUPPORTED_LANGS.includes(value as Lang);
}

export function normalizeLang(input?: string | null): Lang {
  return isLang(input) ? input : DEFAULT_LANG;
}

export async function getMessages(lang: Lang): Promise<Messages> {
  return dictionaries[lang] ?? enMessages;
}

export async function getT(lang: Lang): Promise<{ t: TFunction; messages: Messages }> {
  const messages = await getMessages(lang);
  return {
    t: createTranslator(messages, lang),
    messages,
  };
}

export function createTranslator(messages: Messages, lang: Lang): TFunction {
  return (key: MessageKey, params?: Record<string, string | number>): string => {
    const value = resolveKey(messages, key) ?? resolveKey(enMessages, key);
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

export function buildLocalizedPath(lang: Lang, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${lang}`;
  }
  if (normalized === `/${lang}` || normalized.startsWith(`/${lang}/`)) {
    return normalized;
  }
  return `/${lang}${normalized}`;
}

export function replaceLanguageInPath(pathname: string, lang: Lang): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && SUPPORTED_LANGS.includes(segments[1] as Lang)) {
    segments[1] = lang;
    return segments.join("/") || "/";
  }
  return buildLocalizedPath(lang, pathname);
}

export function getPreferredLanguage(acceptLanguageHeader?: string | null): Lang {
  if (!acceptLanguageHeader) {
    return DEFAULT_LANG;
  }
  const lowered = acceptLanguageHeader.toLowerCase();
  if (lowered.includes("zh")) {
    return "zh";
  }
  if (lowered.includes("ja")) {
    return "ja";
  }
  return DEFAULT_LANG;
}

function resolveKey(messages: Messages, key: MessageKey): string | undefined {
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
