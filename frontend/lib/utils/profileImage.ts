/**
 * Utility functions for handling profile images with fallbacks
 */

/**
 * Data URL for a simple fallback avatar (blue circle with white person icon)
 * This is used when no profile image is available
 */
const FALLBACK_AVATAR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzI1NjNlQiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSIzMCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjxwYXRoIGQ9Ik0gNTAgMTUwIFEgMTAwIDEyMCAxNTAgMTUwIEwgMTUwIDIwMCBMIDUwIDIwMCBaIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+';

/**
 * Get the profile image URL with fallback handling
 * @param photoUrl - The photo URL from the user object
 * @returns The full URL to the profile image or data URL fallback
 */
export function getProfileImageUrl(photoUrl?: string | null): string {
  if (!photoUrl) {
    return FALLBACK_AVATAR_DATA_URL;
  }

  // If it's already a full URL (starts with http), return as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }

  // If it's a relative path, construct the full URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${apiUrl}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
}

/**
 * Get the fallback avatar URL (data URL)
 */
export function getFallbackAvatarUrl(): string {
  return FALLBACK_AVATAR_DATA_URL;
}
