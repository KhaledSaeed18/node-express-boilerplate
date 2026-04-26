import { config } from 'dotenv';
import { resolve } from 'path';
import { cleanDatabase, testPrisma } from './db';
import { Container } from '../../src/container';

config({ path: resolve(process.cwd(), '.env.test') });

beforeEach(async () => {
    await cleanDatabase();
    Container.resetInstance();
});

afterAll(async () => {
    await cleanDatabase();
    await testPrisma.$disconnect();
});
