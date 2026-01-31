'use client';

import React, { useState } from 'react';
import {
    Twitter,
    Send,
    MessageCircle,
    Facebook,
    Link as LinkIcon,
    Check
} from 'lucide-react';

interface SocialShareProps {
    url: string;
    title: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title }) => {
    const [copied, setCopied] = useState(false);

    const shareLinks = [
        {
            name: 'X (Twitter)',
            icon: <Twitter className="w-4 h-4" />,
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
            color: 'hover:bg-sky-500'
        },
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="w-4 h-4" />,
            href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`,
            color: 'hover:bg-green-500'
        },
        {
            name: 'Telegram',
            icon: <Send className="w-4 h-4" />,
            href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            color: 'hover:bg-blue-400'
        },
        {
            name: 'Facebook',
            icon: <Facebook className="w-4 h-4" />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            color: 'hover:bg-blue-700'
        }
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mr-2 hidden sm:inline">Share:</span>
            <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-full p-1.5 border border-neutral-200/20 shadow-sm">
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.name}
                        className={`p-1.5 rounded-full text-white/80 ${link.color} hover:text-white transition-all duration-300 hover:scale-110 active:scale-95`}
                    >
                        {link.icon}
                    </a>
                ))}
                <button
                    onClick={copyToClipboard}
                    className="p-1 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
                    title="Copy Link"
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                </button>
            </div>

            {copied && (
                <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-tighter animate-pulse ml-2">
                    Link Copied!
                </div>
            )}
        </div>
    );
};

export default SocialShare;
