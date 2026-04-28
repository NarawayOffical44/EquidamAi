/**
 * Browser Session Token Generator
 * Generates and manages unique session tokens for tracking rate limits per browser
 * Stored in localStorage - persists across sessions
 */

const SESSION_TOKEN_KEY = "evaldam_session_token";
const SESSION_TOKEN_VERSION = 1;

/**
 * Generate a unique session token
 */
function generateToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}${randomPart2}`;
}

/**
 * Get or create a browser session token
 * First call generates a new token, subsequent calls return the same token
 * Token persists in localStorage
 */
export function getSessionToken(): string {
  if (typeof window === "undefined") {
    return "server-side";
  }

  try {
    let token = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!token) {
      token = generateToken();
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    }

    return token;
  } catch (error) {
    console.warn("Failed to access localStorage for session token", error);
    // Fallback: generate temporary token if localStorage fails
    return generateToken();
  }
}

/**
 * Clear the session token (e.g., when user signs up)
 */
export function clearSessionToken(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (error) {
      console.warn("Failed to clear session token", error);
    }
  }
}

/**
 * Get token for API requests
 */
export function getTokenForRequest(): string {
  return getSessionToken();
}
