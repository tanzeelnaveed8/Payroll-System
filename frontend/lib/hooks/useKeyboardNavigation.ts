"use client";

import { useEffect, useCallback } from "react";

/**
 * Custom hook for keyboard navigation enhancements
 * 
 * Provides keyboard shortcuts and navigation patterns for better accessibility.
 * Supports common patterns like Escape to close modals, Enter to submit, etc.
 * 
 * @example
 * useKeyboardNavigation({
 *   onEscape: () => closeModal(),
 *   onEnter: () => submitForm(),
 * });
 */
export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: (e: KeyboardEvent) => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  enabled?: boolean;
  target?: HTMLElement | null;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    enabled = true,
    target,
  } = options;

  const handleKeyDown = useCallback(
    (e: Event) => {
      if (!enabled) return;

      // Cast to KeyboardEvent since we know this is a keydown event
      const keyEvent = e as KeyboardEvent;

      // Check if target is specified and event didn't originate from it
      if (target && !target.contains(keyEvent.target as Node)) {
        return;
      }

      switch (keyEvent.key) {
        case "Escape":
          if (onEscape) {
            keyEvent.preventDefault();
            keyEvent.stopPropagation();
            onEscape();
          }
          break;
        case "Enter":
          // Only trigger if not in an input/textarea/select
          if (onEnter && !(keyEvent.target instanceof HTMLInputElement || keyEvent.target instanceof HTMLTextAreaElement || keyEvent.target instanceof HTMLSelectElement)) {
            onEnter(keyEvent);
          }
          break;
        case "ArrowUp":
          if (onArrowUp) {
            keyEvent.preventDefault();
            onArrowUp();
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            keyEvent.preventDefault();
            onArrowDown();
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft) {
            keyEvent.preventDefault();
            onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (onArrowRight) {
            keyEvent.preventDefault();
            onArrowRight();
          }
          break;
        case "Tab":
          if (onTab) {
            onTab();
          }
          break;
      }
    },
    [enabled, target, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  );

  useEffect(() => {
    if (!enabled) return;

    const element = target || window;
    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, target, handleKeyDown]);
}

/**
 * Hook for focus trap management (useful for modals)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key !== "Tab") return;

      if (keyEvent.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          keyEvent.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          keyEvent.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);

    // Focus first element when trap is activated
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, [enabled, containerRef]);
}
