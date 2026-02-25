/**
 * Utility functions for parsing and managing URL parameters
 * Works with both hash-based and browser-based routing
 */

/**
 * Extracts a URL parameter from the current URL
 * Works with both query strings (?param=value) and hash-based routing (#/?param=value)
 *
 * @param paramName - The name of the parameter to extract
 * @returns The parameter value if found, null otherwise
 */
export function getUrlParameter(paramName: string): string | null {
    // Try to get from regular query string first
    const urlParams = new URLSearchParams(window.location.search);
    const regularParam = urlParams.get(paramName);

    if (regularParam !== null) {
        return regularParam;
    }

    // If not found, try to extract from hash (for hash-based routing)
    const hash = window.location.hash;
    const queryStartIndex = hash.indexOf('?');

    if (queryStartIndex !== -1) {
        const hashQuery = hash.substring(queryStartIndex + 1);
        const hashParams = new URLSearchParams(hashQuery);
        return hashParams.get(paramName);
    }

    return null;
}

/**
 * Stores a parameter in sessionStorage for persistence across navigation
 * Useful for maintaining state like admin tokens throughout the session
 *
 * @param key - The key to store the value under
 * @param value - The value to store
 */
export function storeSessionParameter(key: string, value: string): void {
    try {
        sessionStorage.setItem(key, value);
    } catch (error) {
        console.warn(`Failed to store session parameter ${key}:`, error);
    }
}

/**
 * Retrieves a parameter from sessionStorage
 *
 * @param key - The key to retrieve
 * @returns The stored value if found, null otherwise
 */
export function getSessionParameter(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch (error) {
        console.warn(`Failed to retrieve session parameter ${key}:`, error);
        return null;
    }
}

/**
 * Gets a parameter from URL or sessionStorage (URL takes precedence)
 * If found in URL, also stores it in sessionStorage for future use
 *
 * @param paramName - The name of the parameter to retrieve
 * @param storageKey - Optional custom storage key (defaults to paramName)
 * @returns The parameter value if found, null otherwise
 */
export function getPersistedUrlParameter(paramName: string, storageKey?: string): string | null {
    const key = storageKey || paramName;

    // Check URL first
    const urlValue = getUrlParameter(paramName);
    if (urlValue !== null) {
        // Store in session for persistence
        storeSessionParameter(key, urlValue);
        return urlValue;
    }

    // Fall back to session storage
    return getSessionParameter(key);
}

/**
 * Removes a parameter from sessionStorage
 *
 * @param key - The key to remove
 */
export function clearSessionParameter(key: string): void {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.warn(`Failed to clear session parameter ${key}:`, error);
    }
}

/**
 * Removes a specific parameter from the URL hash without reloading the page
 * Preserves route information and other parameters in the hash
 */
function clearParamFromHash(paramName: string): void {
    if (!window.history.replaceState) {
        return;
    }

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) {
        return;
    }

    const hashContent = hash.substring(1);
    const queryStartIndex = hashContent.indexOf('?');

    if (queryStartIndex === -1) {
        return;
    }

    const routePath = hashContent.substring(0, queryStartIndex);
    const queryString = hashContent.substring(queryStartIndex + 1);

    const params = new URLSearchParams(queryString);
    params.delete(paramName);

    const newQueryString = params.toString();
    let newHash = routePath;

    if (newQueryString) {
        newHash += '?' + newQueryString;
    }

    const newUrl = window.location.pathname + window.location.search + (newHash ? '#' + newHash : '');
    window.history.replaceState(null, '', newUrl);
}

/**
 * Gets a secret from the URL hash fragment only (more secure than query params)
 */
export function getSecretFromHash(paramName: string): string | null {
    const existingSecret = getSessionParameter(paramName);
    if (existingSecret !== null) {
        return existingSecret;
    }

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) {
        return null;
    }

    const hashContent = hash.substring(1);
    const params = new URLSearchParams(hashContent);
    const secret = params.get(paramName);

    if (secret) {
        storeSessionParameter(paramName, secret);
        clearParamFromHash(paramName);
        return secret;
    }

    return null;
}

/**
 * Gets a secret parameter with fallback chain: hash -> sessionStorage
 */
export function getSecretParameter(paramName: string): string | null {
    return getSecretFromHash(paramName);
}

/**
 * Extracts the Stripe session_id from the current URL query string.
 * Stripe appends ?session_id=xxx to the success redirect URL.
 *
 * @returns The session_id value if present, null otherwise
 */
export function getSessionIdFromUrl(): string | null {
    return getUrlParameter('session_id');
}
