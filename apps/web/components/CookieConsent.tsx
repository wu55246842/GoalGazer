"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            setShow(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("cookie_consent", "true");
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 p-4 z-50">
            <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-neutral-300">
                    We use cookies to analyze traffic and improve your experience. By using our website, you agree to our{" "}
                    <Link href="/privacy" className="text-emerald-400 hover:underline">
                        Privacy Policy
                    </Link>
                    .
                </p>
                <button
                    onClick={accept}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
                >
                    Accept
                </button>
            </div>
        </div>
    );
}
