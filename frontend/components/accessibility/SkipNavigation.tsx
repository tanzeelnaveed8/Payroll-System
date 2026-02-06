"use client";

/**
 * Skip Navigation Component
 * 
 * Provides keyboard users with a way to skip to main content,
 * improving navigation efficiency and WCAG 2.1 AA compliance.
 * 
 * Usage: Add to root layout or main dashboard layout
 * 
 * The skip link is hidden by default and becomes visible when focused.
 * This is the standard pattern for skip navigation links.
 */
export default function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-[#2563EB] focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:font-semibold focus:transition-all"
      onClick={(e) => {
        e.preventDefault();
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      Skip to main content
    </a>
  );
}
