import { config } from 'dotenv';
import { execSync } from 'child_process';
import { resolve } from 'path';

export default async function setup(): Promise<void> {
    // override: true so test vars like BASE_URL win over Vite's default BASE_URL='/'
    config({ path: resolve(process.cwd(), '.env.test'), override: true });

    execSync('pnpm exec prisma migrate deploy', {
        env: { ...process.env },
        stdio: 'inherit',
    });
}
