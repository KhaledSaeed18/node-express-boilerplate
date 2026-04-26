import bcrypt from 'bcryptjs';
import { testPrisma } from './db';
import type { User, Note } from '../../src/generated/prisma/client';

export const TEST_PASSWORD = 'Password1!';

export async function createTestUser(
    overrides: Partial<{ email: string; username: string; password: string }> = {},
): Promise<User & { rawPassword: string }> {
    const rawPassword = overrides.password ?? TEST_PASSWORD;
    const hashed = await bcrypt.hash(rawPassword, 1);
    const ts = Date.now();
    const user = await testPrisma.user.create({
        data: {
            email: overrides.email ?? `test-${ts}@example.com`,
            username: overrides.username ?? `user-${ts}`,
            password: hashed,
        },
    });
    return { ...user, rawPassword };
}

export async function createTestNote(
    userId: string,
    overrides: Partial<{ title: string; content: string }> = {},
): Promise<Note> {
    return testPrisma.note.create({
        data: {
            title: overrides.title ?? 'Test Note',
            content: overrides.content ?? 'Test content',
            userId,
        },
    });
}
