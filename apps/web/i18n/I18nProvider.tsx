"use client";

import { createContext, useContext, useMemo } from "react";
import enMessages from "./messages/en.json";
import { createTranslator, DEFAULT_LANG, type Lang, type Messages, type TFunction } from "./index";

interface I18nContextValue {
  lang: Lang;
  messages: Messages;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue>({
  lang: DEFAULT_LANG,
  messages: enMessages,
  t: createTranslator(enMessages, DEFAULT_LANG),
});

export function I18nProvider({
  lang,
  messages,
  children,
}: {
  lang: Lang;
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
