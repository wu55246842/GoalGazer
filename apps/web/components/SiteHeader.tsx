"use client";

import React, { useState, useEffect } from "react";
import { buildLocalizedPath } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavLink {
    href: string;
    label: string;
}

interface SiteHeaderProps {
    lang: string;
    brandName: string;
    navLinks: NavLink[];
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ lang, brandName, navLinks }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when clicking outside or on a link
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMenuOpen]);

    return (
        <header className="site-header">
            <div className="container">
                <div className="header-wrapper">
                    <a href={buildLocalizedPath(lang, "/")} className="logo" onClick={closeMenu}>
                        <span className="logo-icon">⚽</span>
                        <span className="logo-text">{brandName}</span>
                    </a>

                    <div className="header-actions">
                        <div className="desktop-nav-wrapper">
                            <nav className="nav desktop-nav">
                                {navLinks.map((link) => (
                                    <a key={link.href} href={buildLocalizedPath(lang, link.href)}>
                                        {link.label}
                                    </a>
                                ))}
                            </nav>
                            <LanguageSwitcher />
                        </div>

                        <button
                            className={`mobile-menu-toggle ${isMenuOpen ? "active" : ""}`}
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? "open" : ""}`}>
                <nav className="mobile-nav">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={buildLocalizedPath(lang, link.href)}
                            onClick={closeMenu}
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="mobile-lang-switcher">
                        <LanguageSwitcher />
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default SiteHeader;
