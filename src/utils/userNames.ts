/*
 * src/utils/usernames
 * Utility functions for generating usernames.
 * This module exports functions to generate a username based on a base string or a random username.
 */

import crypto from 'crypto';
import { prisma } from '../database/prismaClient';

export function generateUsername(base?: string): string {
    if (base) {
        const sanitized = base.toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = crypto.randomInt(1000, 9999).toString();
        return sanitized + suffix;
    }
    return 'user' + crypto.randomInt(10000, 99999).toString();
}

export async function generateUniqueUsername(base: string, maxAttempts = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const usernameCandidate = generateUsername(base);
        const exists = await prisma.user.findUnique({
            where: { username: usernameCandidate },
        });
        if (!exists) {
            return usernameCandidate;
        }
    }
    throw new Error('Failed to generate unique username after several attempts');
}
