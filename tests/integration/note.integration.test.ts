import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createTestUser, createTestNote, TEST_PASSWORD } from '../helpers/factories';

const AUTH_BASE = '/api/v1/auth';
const NOTE_BASE = '/api/v1/note';

type Agent = ReturnType<typeof request.agent>;

async function makeAgent(): Promise<{ agent: Agent; csrfToken: string }> {
    const agent = request.agent(app);
    const res = await agent.get(`${AUTH_BASE}/csrf-token`);
    return { agent, csrfToken: res.body.csrfToken as string };
}

async function signedInAgent(email: string): Promise<{ agent: Agent; csrfToken: string }> {
    const { agent, csrfToken } = await makeAgent();
    await createTestUser({ email });
    await agent
        .post(`${AUTH_BASE}/signin`)
        .set('x-csrf-token', csrfToken)
        .send({ email, password: TEST_PASSWORD });
    return { agent, csrfToken };
}

describe('Note Integration', () => {
    // ------------------------------------------------------------------
    describe('POST /note', () => {
        it('returns 201 with the created note for an authenticated user', async () => {
            const { agent, csrfToken } = await signedInAgent(`note-create-${Date.now()}@example.com`);

            const res = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'My Note', content: 'Hello world' });

            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe('My Note');
            expect(res.body.data.content).toBe('Hello world');
        });

        it('returns 401 for unauthenticated requests', async () => {
            const { agent, csrfToken } = await makeAgent();

            const res = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Title', content: 'Content' });

            expect(res.status).toBe(401);
        });

        it('returns 400 for missing title or content', async () => {
            const { agent, csrfToken } = await signedInAgent(`note-invalid-${Date.now()}@example.com`);

            const res = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: '' });

            expect(res.status).toBe(400);
        });
    });

    // ------------------------------------------------------------------
    describe('GET /note', () => {
        it('returns 200 with a paginated list of the user\'s notes', async () => {
            const { agent, csrfToken } = await signedInAgent(`note-list-${Date.now()}@example.com`);

            // Create a note via the API so it belongs to the signed-in user
            await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Listed Note', content: 'Body' });

            const res = await agent.get(NOTE_BASE);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(1);
        });

        it('returns 401 for unauthenticated requests', async () => {
            const res = await request(app).get(NOTE_BASE);
            expect(res.status).toBe(401);
        });

        it('respects page and limit query params', async () => {
            const email = `note-page-${Date.now()}@example.com`;
            const { agent, csrfToken } = await signedInAgent(email);

            // Create 3 notes
            for (let i = 1; i <= 3; i++) {
                await agent
                    .post(NOTE_BASE)
                    .set('x-csrf-token', csrfToken)
                    .send({ title: `Note ${i}`, content: `Content ${i}` });
            }

            const res = await agent.get(`${NOTE_BASE}?page=1&limit=2`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });
    });

    // ------------------------------------------------------------------
    describe('GET /note/search', () => {
        it('returns 200 with notes matching the query', async () => {
            const email = `note-search-${Date.now()}@example.com`;
            const { agent, csrfToken } = await signedInAgent(email);

            await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Unique Search Title', content: 'Unique content' });

            const res = await agent.get(`${NOTE_BASE}/search?q=Unique+Search`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });

        it('returns 401 for unauthenticated requests', async () => {
            const res = await request(app).get(`${NOTE_BASE}/search?q=test`);
            expect(res.status).toBe(401);
        });
    });

    // ------------------------------------------------------------------
    describe('GET /note/:id', () => {
        it('returns 200 with the note for the owner', async () => {
            const email = `note-get-${Date.now()}@example.com`;
            const { agent, csrfToken } = await signedInAgent(email);

            const createRes = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Fetchable', content: 'Body' });

            const noteId = createRes.body.data.id as string;
            const res = await agent.get(`${NOTE_BASE}/${noteId}`);
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(noteId);
        });

        it('returns 404 for a non-existent note', async () => {
            const { agent } = await signedInAgent(`note-404-${Date.now()}@example.com`);
            const res = await agent.get(`${NOTE_BASE}/c000000000000000000000000`);
            expect(res.status).toBe(404);
        });

        it('returns 403 when accessing another user\'s note', async () => {
            // User A creates a note
            const userA = await createTestUser({ email: `usera-${Date.now()}@example.com` });
            const note = await createTestNote(userA.id, { title: 'Private' });

            // User B tries to access it
            const { agent } = await signedInAgent(`userb-${Date.now()}@example.com`);
            const res = await agent.get(`${NOTE_BASE}/${note.id}`);
            expect(res.status).toBe(403);
        });
    });

    // ------------------------------------------------------------------
    describe('PUT /note/:id', () => {
        it('returns 200 with the updated note', async () => {
            const email = `note-update-${Date.now()}@example.com`;
            const { agent, csrfToken } = await signedInAgent(email);

            const createRes = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Old Title', content: 'Old content' });

            const noteId = createRes.body.data.id as string;

            const res = await agent
                .put(`${NOTE_BASE}/${noteId}`)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'New Title' });

            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('New Title');
        });

        it('returns 400 when no update fields are provided', async () => {
            const email = `note-update-empty-${Date.now()}@example.com`;
            const { agent, csrfToken } = await signedInAgent(email);

            const createRes = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Title', content: 'Content' });

            const noteId = createRes.body.data.id as string;

            const res = await agent
                .put(`${NOTE_BASE}/${noteId}`)
                .set('x-csrf-token', csrfToken)
                .send({});

            expect(res.status).toBe(400);
        });

        it('returns 403 when updating another user\'s note', async () => {
            const userA = await createTestUser({ email: `upd-usera-${Date.now()}@example.com` });
            const note = await createTestNote(userA.id);

            const { agent, csrfToken } = await signedInAgent(`upd-userb-${Date.now()}@example.com`);
            const res = await agent
                .put(`${NOTE_BASE}/${note.id}`)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Stolen' });

            expect(res.status).toBe(403);
        });
    });

    // ------------------------------------------------------------------
    describe('DELETE /note/:id', () => {
        it('returns 204 on successful deletion', async () => {
            const email = `note-delete-${Date.now()}@example.com`;
            const { agent, csrfToken } = await signedInAgent(email);

            const createRes = await agent
                .post(NOTE_BASE)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'To Delete', content: 'Gone' });

            const noteId = createRes.body.data.id as string;

            const res = await agent
                .delete(`${NOTE_BASE}/${noteId}`)
                .set('x-csrf-token', csrfToken);

            expect(res.status).toBe(204);
        });

        it('returns 403 when deleting another user\'s note', async () => {
            const userA = await createTestUser({ email: `del-usera-${Date.now()}@example.com` });
            const note = await createTestNote(userA.id);

            const { agent, csrfToken } = await signedInAgent(`del-userb-${Date.now()}@example.com`);
            const res = await agent
                .delete(`${NOTE_BASE}/${note.id}`)
                .set('x-csrf-token', csrfToken);

            expect(res.status).toBe(403);
        });
    });
});
