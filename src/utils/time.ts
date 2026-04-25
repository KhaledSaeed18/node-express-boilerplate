/*
 * src/utils/time.ts
 * Utilities for working with JWT-style expiry strings (e.g. "15m", "7d").
 */

const TIME_UNITS: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
};

/**
 * Parses a JWT-style expiry string (e.g. "15m", "7d", "3600s") to milliseconds.
 * Returns 0 for unrecognised formats.
 */
export const parseExpireTimeMs = (expiry: string): number => {
    const match = /^(\d+)(ms|s|m|h|d|w)$/.exec(expiry);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    return value * (TIME_UNITS[match[2]] ?? 0);
};
