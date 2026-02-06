"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook for screen reader announcements
 * 
 * Provides a way to announce dynamic content changes to screen readers
 * using ARIA live regions. This is essential for WCAG 2.1 AA compliance.
 * 
 * @example
 * const announce = useAnnouncement();
 * announce("Dashboard data refreshed successfully");
 */
export function useAnnouncement() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a live region for announcements if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement("div");
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";
      liveRegion.id = "announcement-live-region";
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      // Cleanup: remove live region on unmount
      if (liveRegionRef.current && liveRegionRef.current.parentNode) {
        liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - "polite" (default) or "assertive" for urgent messages
   */
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    if (!liveRegionRef.current) return;

    // Update aria-live priority if needed
    liveRegionRef.current.setAttribute("aria-live", priority);

    // Clear previous message
    liveRegionRef.current.textContent = "";

    // Use setTimeout to ensure the screen reader picks up the change
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    }, 100);

    // Clear message after announcement (optional, prevents stale announcements)
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = "";
      }
    }, 1000);
  };

  return announce;
}

/**
 * Hook for urgent/assertive announcements
 * Use sparingly for critical updates that need immediate attention
 */
export function useUrgentAnnouncement() {
  const announce = useAnnouncement();
  return (message: string) => announce(message, "assertive");
}
