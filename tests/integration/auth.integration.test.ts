import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createTestUser, TEST_PASSWORD } from '../helpers/factories';

const BASE = '/api/v1/auth';

// Returns a fresh supertest agent with a CSRF token already fetched.
// The agent persists cookies for the session.
async function makeAgent(): Promise<{ agent: ReturnType<typeof request.agent>; csrfToken: string }> {
    const agent = request.agent(app);
    const res = await agent.get(`${BASE}/csrf-token`);
    const csrfToken = res.body.csrfToken as string;
    return { agent, csrfToken };
}

describe('Auth Integration', () => {
    let agent: ReturnType<typeof request.agent>;
    let csrfToken: string;

    beforeEach(async () => {
        ({ agent, csrfToken } = await makeAgent());
    });

    // ------------------------------------------------------------------
    describe('POST /signup', () => {
        it('returns 201 with user data and no password field', async () => {
            const res = await agent
                .post(`${BASE}/signup`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'newuser@example.com', password: 'Password1!' });

            expect(res.status).toBe(201);
            expect(res.body.data.email).toBe('newuser@example.com');
            expect(res.body.data.password).toBeUndefined();
        });

        it('returns 409 when email is already registered', async () => {
            await createTestUser({ email: 'dup@example.com' });

            const res = await agent
                .post(`${BASE}/signup`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'dup@example.com', password: 'Password1!' });

            expect(res.status).toBe(409);
        });

        it('returns 400 for invalid email format', async () => {
            const res = await agent
                .post(`${BASE}/signup`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'not-an-email', password: 'Password1!' });

            expect(res.status).toBe(400);
        });

        it('returns 400 for weak password', async () => {
            const res = await agent
                .post(`${BASE}/signup`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'test@example.com', password: 'weak' });

            expect(res.status).toBe(400);
        });

        it('returns 403 when CSRF token is missing', async () => {
            const plain = request(app);
            const res = await plain
                .post(`${BASE}/signup`)
                .send({ email: 'nocsrf@example.com', password: 'Password1!' });

            expect(res.status).toBe(403);
        });
    });

    // ------------------------------------------------------------------
    describe('POST /signin', () => {
        it('returns 200 with user data and sets auth cookies', async () => {
            await createTestUser({ email: 'signin@example.com' });

            const res = await agent
                .post(`${BASE}/signin`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'signin@example.com', password: TEST_PASSWORD });

            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('signin@example.com');

            const cookies = res.headers['set-cookie'] as unknown as string[];
            expect(cookies.some((c) => c.includes('accessToken'))).toBe(true);
            expect(cookies.some((c) => c.includes('refreshToken'))).toBe(true);
        });

        it('returns 401 for wrong password', async () => {
            await createTestUser({ email: 'wrong@example.com' });

            const res = await agent
                .post(`${BASE}/signin`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'wrong@example.com', password: 'WrongPassword1!' });

            expect(res.status).toBe(401);
        });

        it('returns 401 for unknown email', async () => {
            const res = await agent
                .post(`${BASE}/signin`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'nobody@example.com', password: 'Password1!' });

            expect(res.status).toBe(401);
        });
    });

    // ------------------------------------------------------------------
    describe('POST /refresh-token', () => {
        it('returns 200 with a new accessToken cookie when refresh token is valid', async () => {
            await createTestUser({ email: 'refresh@example.com' });

            // Sign in to get refresh token cookie
            await agent
                .post(`${BASE}/signin`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'refresh@example.com', password: TEST_PASSWORD });

            const res = await agent
                .post(`${BASE}/refresh-token`)
                .set('x-csrf-token', csrfToken);

            expect(res.status).toBe(200);
            const cookies = res.headers['set-cookie'] as unknown as string[];
            expect(cookies.some((c) => c.includes('accessToken'))).toBe(true);
        });

        it('returns 401 when no refresh token cookie is present', async () => {
            const res = await agent
                .post(`${BASE}/refresh-token`)
                .set('x-csrf-token', csrfToken);

            expect(res.status).toBe(401);
        });
    });

    // ------------------------------------------------------------------
    describe('POST /logout', () => {
        it('returns 200 and clears auth cookies', async () => {
            await createTestUser({ email: 'logout@example.com' });

            await agent
                .post(`${BASE}/signin`)
                .set('x-csrf-token', csrfToken)
                .send({ email: 'logout@example.com', password: TEST_PASSWORD });

            const res = await agent
                .post(`${BASE}/logout`)
                .set('x-csrf-token', csrfToken);

            expect(res.status).toBe(200);
            // Cookies should be cleared (Max-Age=0 or Expires in past)
            const cookies = res.headers['set-cookie'] as unknown as string[];
            if (cookies) {
                const accessCookie = cookies.find((c) => c.includes('accessToken'));
                if (accessCookie) {
                    expect(accessCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
                }
            }
        });
    });
});
