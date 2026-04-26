import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../src/services/auth.service';
import type { IUserRepository } from '../../../src/repository';
import type { User } from '../../../src/generated/prisma/client';
import { ConflictError, AuthenticationError, NotFoundError, ValidationError } from '../../../src/errors';

// ---- helpers ----

function makeUser(overrides: Partial<User> = {}): User {
    const now = new Date();
    return {
        id: 'user-id-1',
        email: 'alice@example.com',
        username: 'alice',
        password: '$2a$04$hashedpassword',
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

function makeUserRepo(overrides: Partial<IUserRepository> = {}): IUserRepository {
    return {
        create: vi.fn(),
        findByEmail: vi.fn(),
        findById: vi.fn(),
        findByUsername: vi.fn(),
        emailExists: vi.fn(),
        usernameExists: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        ...overrides,
    };
}

// ---- tests ----

describe('AuthService', () => {
    let repo: IUserRepository;
    let service: AuthService;

    beforeEach(() => {
        repo = makeUserRepo();
        service = new AuthService(repo);
    });

    // ------------------------------------------------------------------
    describe('signUp', () => {
        it('creates a user and returns UserResponseDTO without password', async () => {
            const user = makeUser();
            vi.mocked(repo.emailExists).mockResolvedValue(false);
            vi.mocked(repo.usernameExists).mockResolvedValue(false);
            vi.mocked(repo.create).mockResolvedValue(user);

            const result = await service.signUp({ email: 'alice@example.com', password: 'Password1!' });

            expect(result.user.id).toBe('user-id-1');
            expect(result.user.email).toBe('alice@example.com');
            expect((result.user as unknown as Record<string, unknown>).password).toBeUndefined();
        });

        it('throws ConflictError when email already exists', async () => {
            vi.mocked(repo.emailExists).mockResolvedValue(true);

            await expect(
                service.signUp({ email: 'alice@example.com', password: 'Password1!' }),
            ).rejects.toThrow(ConflictError);
        });

        it('derives username from email prefix', async () => {
            const user = makeUser({ username: 'alice' });
            vi.mocked(repo.emailExists).mockResolvedValue(false);
            vi.mocked(repo.usernameExists).mockResolvedValue(false);
            vi.mocked(repo.create).mockResolvedValue(user);

            await service.signUp({ email: 'alice@example.com', password: 'Password1!' });

            const createCall = vi.mocked(repo.create).mock.calls[0][0];
            expect(createCall.username).toMatch(/^alice/);
        });

        it('hashes the password before storing', async () => {
            const user = makeUser();
            vi.mocked(repo.emailExists).mockResolvedValue(false);
            vi.mocked(repo.usernameExists).mockResolvedValue(false);
            vi.mocked(repo.create).mockResolvedValue(user);

            await service.signUp({ email: 'alice@example.com', password: 'Password1!' });

            const createCall = vi.mocked(repo.create).mock.calls[0][0];
            expect(createCall.password).not.toBe('Password1!');
            expect(createCall.password).toMatch(/^\$2[ab]\$/);
        });
    });

    // ------------------------------------------------------------------
    describe('signIn', () => {
        it('returns user + access + refresh tokens on valid credentials', async () => {
            // Use a real bcrypt hash of "Password1!" at cost 4
            const bcrypt = await import('bcryptjs');
            const hashed = await bcrypt.hash('Password1!', 1);
            const user = makeUser({ password: hashed });
            vi.mocked(repo.findByEmail).mockResolvedValue(user);

            const result = await service.signIn({ email: 'alice@example.com', password: 'Password1!' });

            expect(result.user.id).toBe('user-id-1');
            expect(result.accessToken).toBeTruthy();
            expect(result.refreshToken).toBeTruthy();
        });

        it('throws AuthenticationError when email is not found', async () => {
            vi.mocked(repo.findByEmail).mockResolvedValue(null);

            await expect(
                service.signIn({ email: 'nobody@example.com', password: 'Password1!' }),
            ).rejects.toThrow(AuthenticationError);
        });

        it('throws AuthenticationError when password is wrong', async () => {
            const bcrypt = await import('bcryptjs');
            const hashed = await bcrypt.hash('CorrectPassword1!', 1);
            const user = makeUser({ password: hashed });
            vi.mocked(repo.findByEmail).mockResolvedValue(user);

            await expect(
                service.signIn({ email: 'alice@example.com', password: 'WrongPassword1!' }),
            ).rejects.toThrow(AuthenticationError);
        });
    });

    // ------------------------------------------------------------------
    describe('refreshToken', () => {
        it('returns a new accessToken for a valid userId', async () => {
            const user = makeUser();
            vi.mocked(repo.findById).mockResolvedValue(user);

            const result = await service.refreshToken('user-id-1');

            expect(result.accessToken).toBeTruthy();
        });

        it('throws ValidationError when userId is empty', async () => {
            await expect(service.refreshToken('')).rejects.toThrow(ValidationError);
        });

        it('throws NotFoundError when user does not exist', async () => {
            vi.mocked(repo.findById).mockResolvedValue(null);

            await expect(service.refreshToken('nonexistent-id')).rejects.toThrow(NotFoundError);
        });
    });

    // ------------------------------------------------------------------
    describe('validateUser', () => {
        it('returns UserResponseDTO for a valid userId', async () => {
            const user = makeUser();
            vi.mocked(repo.findById).mockResolvedValue(user);

            const result = await service.validateUser('user-id-1');

            expect(result.id).toBe('user-id-1');
            expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
        });

        it('throws ValidationError when userId is empty', async () => {
            await expect(service.validateUser('')).rejects.toThrow(ValidationError);
        });

        it('throws NotFoundError when user does not exist', async () => {
            vi.mocked(repo.findById).mockResolvedValue(null);

            await expect(service.validateUser('nonexistent-id')).rejects.toThrow(NotFoundError);
        });
    });
});
