import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

const HEALTH_URL = '/api/v1/health';

describe('Health Integration', () => {
    it('returns 200 with status ok when the database is connected', async () => {
        const res = await request(app).get(HEALTH_URL);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.db).toBe('connected');
        expect(typeof res.body.uptime).toBe('number');
        expect(res.headers['cache-control']).toBe('no-store');
    });
});
