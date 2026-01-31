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
    league: string; // Added league
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
    availableLeagues?: { league: string; comic_image_url?: string; headline?: string }[];
}

const DailyDigestView: React.FC<Props> = ({ digest, lang, t, matchHighlights = [], availableLeagues = [] }) => {
    return (
        <div className="flex flex-col gap-16 font-serif text-white">
            {/* HEADLINE SECTION */}
            <section className="text-center space-y-8 border-b border-white/10 pb-12">
                <div className="flex justify-center mb-4">
                    <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-mono uppercase tracking-widest rounded-full">
                        {digest.league === 'epl' ? 'Premier League' : digest.league} Edition
                    </span>
                </div>
                <h2 className="text-white text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase font-serif hover:text-emerald-500 transition-colors duration-500">
                    {digest.headline}
                </h2>
                <div className="flex justify-center items-center gap-4 text-sm font-mono tracking-widest text-white/60 uppercase">
                    <span>Exclusive Report</span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                    <span>Tactical Deep Dive</span>
                </div>
            </section>

            {/* MAIN CONTENT: Image + Columns */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* Main Visual (Comic) - Spans 7 cols */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    {digest.comic_image_url && (
                        <div className="group relative aspect-video w-full overflow-hidden border-4 border-white/10 bg-white/5">
                            <Image
                                src={digest.comic_image_url}
                                alt="Tactical Editorial"
                                fill
                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                                priority
                            />
                            <div className="absolute bottom-0 left-0 bg-black/80 px-4 py-2 text-xs font-mono text-emerald-500 border-t border-r border-emerald-500/30">
                                FIG 1.0 — {t('Daily.tactical_comic')}
                            </div>
                        </div>
                    )}
                    <p className="text-xs font-mono text-white/40 text-center uppercase tracking-widest border-t border-white/10 pt-4 mt-2">
                        {t('Daily.production_notice')}
                    </p>
                </div>

                {/* Editorial Columns - Spans 5 cols */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full">
                    <div className="prose prose-lg max-w-none text-justify prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-li:text-white/80">
                        <p className="font-serif text-xl leading-relaxed text-white/90 first-letter:text-7xl first-letter:font-black first-letter:text-emerald-500 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">
                            {digest.summary}
                        </p>
                    </div>

                    {/* Financial Ticker Box */}
                    <div className="mt-12 p-6 border-y-2 border-white/10 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-4 font-mono text-xs text-white/50 uppercase tracking-widest">
                            <span>{t('Daily.financial_pulse')}</span>
                            <span className="animate-pulse text-emerald-500">● LIVE</span>
                        </div>
                        <div className="divide-y divide-white/10">
                            {digest.financial_movements?.map((move, i) => (
                                <div key={i} className="flex justify-between items-center py-2 text-sm">
                                    <span className="font-bold text-white/80">{move.player}</span>
                                    <span className={`font-mono font-bold ${move.direction === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {move.direction === 'up' ? '▲' : '▼'} {move.change}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SPORTS SECTION (Highlights Ribbon) */}
            {/* {matchHighlights.length > 0 && (
                <section className="border-t-4 border-black border-double pt-12 mt-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-white text-black font-black px-4 py-1 text-xl uppercase tracking-tighter transform -rotate-2">
                            Sports Section
                        </div>
                        <div className="h-px bg-white/20 flex-grow" />
                        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Matches in this Issue</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {matchHighlights.map((match) => (
                            <a
                                key={match.match_id}
                                href={`/${lang}/matches/${match.slug}`}
                                className="group block space-y-4"
                            >
                                <div className="relative h-64 border border-white/20 overflow-hidden bg-white/5 grayscale group-hover:grayscale-0 transition-all duration-500">
                                    <Image
                                        src={match.image || '/placeholder-match.jpg'}
                                        alt={match.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-emerald-400 font-mono text-xs uppercase underline underline-offset-4">Read Full Analysis &rarr;</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono text-white/50 mb-1 border-b border-white/10 pb-1 inline-block">
                                        {match.home_team} VS {match.away_team}
                                    </div>
                                    <h4 className="text-xl font-bold font-serif leading-tight text-white group-hover:text-emerald-400 transition-colors">
                                        {match.title}
                                    </h4>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )} */}

            {/* LEAGUE SWITCHER / GLOBAL EDITIONS (Now at Bottom with Images) */}
            {availableLeagues.length > 0 && (
                <section className="border-t border-white/10 pt-12 mt-4 pb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-transparent border border-white/20 text-white px-4 py-1 text-lg uppercase tracking-widest font-mono">
                            Global Editions
                        </div>
                        <div className="h-px bg-white/20 flex-grow" />
                        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Other Leagues Today</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {availableLeagues.map((l) => (
                            <a
                                key={l.league}
                                href={`/${lang}/daily/${digest.date_str}?league=${l.league}`}
                                className={`group relative aspect-[3/4] border border-white/20 bg-white/5 overflow-hidden block ${l.league === digest.league ? 'ring-2 ring-emerald-500' : ''}`}
                            >
                                {/* Image Background */}
                                <Image
                                    src={l.comic_image_url || '/placeholder-match.jpg'} // Fallback if no comic
                                    alt={l.headline || l.league}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                                {/* Top Left Badge (League Name) */}
                                <div className="absolute top-0 left-0 bg-black/80 text-white text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-b border-r border-white/20">
                                    {l.league === 'epl' ? 'Premier League' : l.league}
                                </div>

                                {/* Active Indicator or Hover Text */}
                                <div className="absolute bottom-0 left-0 w-full p-3 text-center transition-transform duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <span className="inline-block text-emerald-400 text-xs uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-b border-emerald-400 pb-0.5">
                                        Read Issue
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default DailyDigestView;
