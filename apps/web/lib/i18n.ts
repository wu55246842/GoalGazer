export type SupportedLanguage = "en" | "zh" | "ja";

export const supportedLanguages: SupportedLanguage[] = ["en", "zh", "ja"];

export const languageLabels: Record<SupportedLanguage, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export const uiText: Record<
  SupportedLanguage,
  {
    languageLabel: string;
    matchAnalysis: string;
    matchVisuals: string;
    playerPerformances: string;
    dataLimitations: string;
    backToMatches: string;
    learnProcess: string;
    dataCitations: string;
    share: string;
    confidence: string;
    venue: string;
    kickoff: string;
    status: string;
    fullTime: string;
    fallbackNotice: string;
    locale: string;
  }
> = {
  en: {
    languageLabel: "Language",
    matchAnalysis: "Match Analysis",
    matchVisuals: "Match Visuals",
    playerPerformances: "Player Performances",
    dataLimitations: "Data Limitations",
    backToMatches: "← Back to All Matches",
    learnProcess: "Learn About Our Process",
    dataCitations: "Data citations",
    share: "Share",
    confidence: "Confidence",
    venue: "Venue",
    kickoff: "Kick-off",
    status: "Status",
    fullTime: "Full Time",
    fallbackNotice: "This language is not available yet. Showing English instead.",
    locale: "en-US",
  },
  zh: {
    languageLabel: "语言",
    matchAnalysis: "比赛分析",
    matchVisuals: "比赛图表",
    playerPerformances: "球员表现",
    dataLimitations: "数据限制",
    backToMatches: "← 返回所有比赛",
    learnProcess: "了解我们的流程",
    dataCitations: "数据引用",
    share: "分享",
    confidence: "置信度",
    venue: "球场",
    kickoff: "开球时间",
    status: "比赛状态",
    fullTime: "全场结束",
    fallbackNotice: "该语言版本暂不可用，已显示英文内容。",
    locale: "zh-CN",
  },
  ja: {
    languageLabel: "言語",
    matchAnalysis: "試合分析",
    matchVisuals: "試合ビジュアル",
    playerPerformances: "選手パフォーマンス",
    dataLimitations: "データ制限",
    backToMatches: "← すべての試合へ戻る",
    learnProcess: "分析プロセスについて",
    dataCitations: "データ出典",
    share: "共有",
    confidence: "信頼度",
    venue: "会場",
    kickoff: "キックオフ",
    status: "試合状況",
    fullTime: "フルタイム",
    fallbackNotice: "この言語はまだ利用できません。英語を表示しています。",
    locale: "ja-JP",
  },
};
