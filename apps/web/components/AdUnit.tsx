"use client";

import React, { useEffect } from "react";

interface AdUnitProps {
    slot: string;
    format?: "auto" | "fluid" | "rectangle";
    responsive?: "true" | "false";
    style?: React.CSSProperties;
    className?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({
    slot,
    format = "auto",
    responsive = "true",
    style,
    className = ""
}) => {
    useEffect(() => {
        try {
            // Ensure adsbygoogle is defined and push the ad
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div className={`ad-unit-container ${className}`} style={{ margin: "2rem 0", textAlign: "center", ...style }}>
            {/* Fallback label for dev/transparency */}
            <div style={{
                fontSize: "0.7rem",
                color: "var(--color-text-dim)",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700
            }}>
                Advertisement
            </div>

            <ins
                className="adsbygoogle"
                style={{ display: "block", minHeight: "100px", ...style }}
                data-ad-client="ca-pub-9915837040894736"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default AdUnit;
