import React from 'react';
import Image from 'next/image';
import { TrendingUp, TrendingDown, BookOpen, Quote } from 'lucide-react';
import { TFunction } from '../i18n';

interface FinancialMovement {
    player: string;
    team: string;
    change: number;
    direction: 'up' | 'down';
    reason: string;
}

interface DailyDigest {
    id: number;
    date_str: string;
    lang: string;
    title: string;
    headline: string;
    summary: string;
    comic_image_url: string;
    financial_movements: FinancialMovement[];
}

interface Props {
    digest: DailyDigest;
    lang: string;
    t: TFunction;
    matchHighlights?: any[];
}

const DailyDigestView: React.FC<Props> = ({ digest, lang, t, matchHighlights = [] }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Front Page Headline & Main Story */}
            <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl relative overflow-hidden group shadow-2xl">
                    {/* Headline */}
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight group-hover:text-emerald-400 transition-colors duration-500">
                            {digest.headline}
                        </h2>

                        <div className="prose prose-invert prose-emerald max-w-none">
                            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-serif first-letter:text-5xl first-letter:font-black first-letter:text-emerald-500 first-letter:mr-3 first-letter:float-left">
                                {digest.summary}
                            </p>
                        </div>
                    </div>

                    {/* Glassmorphism background effect */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
                </div>

                {/* Tactical Comic Illustration */}
                {digest.comic_image_url && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-white/40 mb-2">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-xs font-mono uppercase tracking-widest font-semibold">{t('Daily.tactical_comic')}</span>
                        </div>
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                            <Image
                                src={digest.comic_image_url}
                                alt="Tactical Comic"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black rounded-full uppercase tracking-tighter">
                                    {t('Daily.exclusive_production')}
                                </span>
                            </div>
                        </div>
                        <p className="text-white/40 text-xs italic text-center px-4 mt-2">
                            {t('Daily.production_notice')}
                        </p>
                    </div>
                )}

                {/* Match Highlights Gallery */}
                {matchHighlights.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-emerald-500" />
                            Featured Analysis
                            <span className="w-8 h-[2px] bg-emerald-500" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {matchHighlights.map((match) => (
                                <a
                                    key={match.match_id}
                                    href={`/${lang}/matches/${match.slug}`}
                                    className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all duration-500 shadow-xl"
                                >
                                    <Image
                                        src={match.image || '/placeholder-match.jpg'}
                                        alt={match.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 text-left">
                                        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">
                                            {match.home_team} vs {match.away_team}
                                        </div>
                                        <h4 className="text-white font-bold text-sm leading-tight line-clamp-2">
                                            {match.title}
                                        </h4>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar: Financials & Highlights */}
            <div className="lg:col-span-4 flex flex-col gap-8">
                {/* Financial Market Ticker */}
                <section className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            {t('Daily.financial_pulse')}
                        </h3>
                        <span className="text-[10px] text-white/40 font-mono uppercase">{t('Daily.value_fluctuations')}</span>
                    </div>

                    <div className="space-y-4">
                        {digest.financial_movements?.map((move, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                                <div className="flex flex-col text-left">
                                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{move.player}</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{move.team}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1 font-mono font-black text-sm ${move.direction === 'up' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                        {move.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        +{move.change}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 italic text-sm text-white/60">
                            <Quote className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="leading-relaxed">
                                "{t('Daily.ticker_notice')}"
                            </p>
                        </div>
                    </div>
                </section>

                {/* Legend / Info */}
                <section className="p-6 border border-white/10 rounded-2xl">
                    <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">{t('Daily.about_edition')}</h4>
                    <p className="text-xs leading-relaxed text-white/40">
                        {t('Daily.about_desc')}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default DailyDigestView;
