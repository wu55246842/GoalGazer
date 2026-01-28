"use client";

import { createContext, useContext, useMemo } from "react";
import { createTranslator, defaultLanguage, type Messages, type SupportedLanguage } from "./index";
import en from "./messages/en";

interface I18nContextValue {
  lang: SupportedLanguage;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: defaultLanguage,
  messages: en,
  t: createTranslator(en, defaultLanguage),
});

export function I18nProvider({
  lang,
  messages,
  children,
}: {
  lang: SupportedLanguage;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    return {
      lang,
      messages,
      t: createTranslator(messages, lang),
    };
  }, [lang, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext).t;
}

export function useLang() {
  return useContext(I18nContext).lang;
}
