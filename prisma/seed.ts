/*
 * prisma/seed.ts
 * Database seed script — creates demo data for development and testing.
 * Run with: pnpm prisma:db:seed
 *
 * This file demonstrates the recommended seed pattern for this boilerplate:
 * use upsert so the script is idempotent (safe to re-run without duplicating data).
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../src/database/prismaClient';

async function main(): Promise<void> {
    const password = await bcrypt.hash('DemoPassword1!', 12);

    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            username: 'demo_user',
            password,
        },
    });

    console.log(`Seeded user: ${user.email} (id: ${user.id})`);

    const notes = [
        { title: 'Welcome note', content: 'Welcome to the Notes API boilerplate!' },
        {
            title: 'Getting started',
            content: 'Sign in with demo@example.com / DemoPassword1! to try the API.',
        },
        {
            title: 'Architecture',
            content: 'Routes → Controllers → Services → Repositories → Prisma (PostgreSQL).',
        },
    ];

    for (const note of notes) {
        await prisma.note.upsert({
            where: {
                // Upsert by title + userId composite to keep seeds idempotent
                // Replace this with a proper unique constraint if your schema has one
                id: `seed-${user.id}-${note.title.toLowerCase().replace(/\s+/g, '-')}`,
            },
            update: {},
            create: {
                id: `seed-${user.id}-${note.title.toLowerCase().replace(/\s+/g, '-')}`,
                title: note.title,
                content: note.content,
                userId: user.id,
            },
        });
    }

    console.log(`Seeded ${notes.length} notes for ${user.email}`);
}

main()
    .catch((error: unknown) => {
        console.error(error);
        throw error;
    })
    .finally(() => void prisma.$disconnect());
