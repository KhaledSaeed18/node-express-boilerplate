---
name: add-test
description: Scaffold unit and integration tests for an existing resource or service. Use when the user asks to add tests, write tests, or improve test coverage for a specific resource, service, controller, or route.
---

When the user asks to add tests for a resource, follow this sequence. Ask for the resource name if not provided.

## Variables

- `<Name>` = PascalCase singular (e.g. `Note`)
- `<name>` = camelCase singular (e.g. `note`)
- `<names>` = camelCase plural (e.g. `notes`)

---

## Unit Tests (`tests/unit/services/<name>.service.test.ts`)

Unit tests cover the service layer in isolation. The repository is fully mocked.

**Structure:**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { <Name>Service } from '../../../src/services/<name>.service';
import type { I<Name>Repository } from '../../../src/repository/<name>.repository';
import { NotFoundError, ConflictError } from '../../../src/errors';

const mockRepository: I<Name>Repository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
};

describe('<Name>Service', () => {
    let service: <Name>Service;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new <Name>Service(mockRepository);
    });

    describe('create', () => {
        it('creates and returns a DTO', async () => {
            vi.mocked(mockRepository.create).mockResolvedValue({ id: '1', /* fields */ } as any);
            const result = await service.create({ /* input */ });
            expect(result).toMatchObject({ id: '1' });
        });

        it('throws ConflictError when item already exists', async () => {
            vi.mocked(mockRepository.create).mockRejectedValue(new ConflictError('<Name> already exists'));
            await expect(service.create({ /* input */ })).rejects.toThrow(ConflictError);
        });
    });

    describe('findById', () => {
        it('returns DTO when found', async () => {
            vi.mocked(mockRepository.findById).mockResolvedValue({ id: '1' } as any);
            const result = await service.findById('1');
            expect(result.id).toBe('1');
        });

        it('throws NotFoundError when not found', async () => {
            vi.mocked(mockRepository.findById).mockResolvedValue(null);
            await expect(service.findById('missing')).rejects.toThrow(NotFoundError);
        });
    });

    // Add describe blocks for: update, delete, list, and any resource-specific methods
});
```

**Coverage requirements (enforced):**
- Lines: 80% | Functions: 85% | Branches: 75% | Statements: 80%

Run with: `pnpm test` or `pnpm test:coverage`

---

## Integration Tests (`tests/integration/<names>.test.ts`)

Integration tests cover the full HTTP cycle against a real database.

**Prerequisites:**

```bash
pnpm db:test:up       # start ephemeral test DB (port 5434)
pnpm db:test:migrate  # apply migrations
```

**Structure:**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { getTestPrisma, cleanupDatabase } from '../helpers/setup';

describe('<Name> endpoints', () => {
    let authCookie: string;
    let csrfToken: string;

    beforeAll(async () => {
        // Sign in as a test user and capture cookies + CSRF token
        const csrfRes = await request(app).get('/api/v1/auth/csrf-token');
        csrfToken = csrfRes.body.data.csrfToken;
        // ... sign in, capture Set-Cookie header
    });

    beforeEach(async () => {
        await cleanupDatabase(); // wipe resource table between tests
    });

    describe('POST /api/v1/<names>', () => {
        it('returns 201 and the created item', async () => {
            const res = await request(app)
                .post('/api/v1/<names>')
                .set('Cookie', authCookie)
                .set('x-csrf-token', csrfToken)
                .send({ /* valid payload */ });

            expect(res.status).toBe(201);
            expect(res.body.data).toMatchObject({ /* expected shape */ });
        });

        it('returns 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/<names>')
                .set('Cookie', authCookie)
                .set('x-csrf-token', csrfToken)
                .send({});

            expect(res.status).toBe(400);
        });

        it('returns 401 when not authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/<names>')
                .set('x-csrf-token', csrfToken)
                .send({ /* valid payload */ });

            expect(res.status).toBe(401);
        });

        it('returns 403 when CSRF token is missing', async () => {
            const res = await request(app)
                .post('/api/v1/<names>')
                .set('Cookie', authCookie)
                .send({ /* valid payload */ });

            expect(res.status).toBe(403);
        });
    });

    // Add describe blocks for: GET (list, single), PUT/PATCH, DELETE
    // Test: 404 for missing resources, 403 for wrong-user access, pagination for lists
});
```

**Coverage requirements (enforced):**
- Lines: 70% | Functions: 75% | Branches: 65% | Statements: 70%

Run with: `pnpm test:integration`

---

## Verification

```bash
pnpm test                # unit — must pass
pnpm test:integration    # integration — must pass (requires test DB)
pnpm test:all            # both suites
```

Fix every failure before reporting the task as done.
