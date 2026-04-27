import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteService } from '../../../src/services/note.service';
import type { INoteRepository } from '../../../src/repository';
import type { Note } from '../../../src/generated/prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../../../src/errors';

// ---- helpers ----

function makeNote(overrides: Partial<Note> = {}): Note {
    const now = new Date();
    return {
        id: 'note-id-1',
        title: 'Test Title',
        content: 'Test content',
        userId: 'user-id-1',
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

function makeNoteRepo(overrides: Partial<INoteRepository> = {}): INoteRepository {
    return {
        create: vi.fn(),
        findById: vi.fn(),
        findByIdAndUserId: vi.fn(),
        findByUserId: vi.fn(),
        searchByUserId: vi.fn(),
        countByUserId: vi.fn(),
        countSearchByUserId: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        noteExists: vi.fn(),
        userOwnsNote: vi.fn(),
        ...overrides,
    };
}

// ---- tests ----

describe('NoteService', () => {
    let repo: INoteRepository;
    let service: NoteService;

    beforeEach(() => {
        repo = makeNoteRepo();
        service = new NoteService(repo);
    });

    // ------------------------------------------------------------------
    describe('createNote', () => {
        it('returns NoteResponseDTO and trims whitespace', async () => {
            const note = makeNote({ title: 'Trimmed', content: 'Body' });
            vi.mocked(repo.create).mockResolvedValue(note);

            const result = await service.createNote('user-id-1', {
                title: '  Trimmed  ',
                content: '  Body  ',
            });

            expect(result.id).toBe('note-id-1');
            const createArg = vi.mocked(repo.create).mock.calls[0][0];
            expect(createArg.title).toBe('Trimmed');
            expect(createArg.content).toBe('Body');
        });
    });

    // ------------------------------------------------------------------
    describe('getUserNotes', () => {
        it('returns paginated result with correct total and totalPages', async () => {
            const notes = [makeNote(), makeNote({ id: 'note-id-2' })];
            vi.mocked(repo.findByUserId).mockResolvedValue(notes);
            vi.mocked(repo.countByUserId).mockResolvedValue(10);

            const result = await service.getUserNotes('user-id-1', { skip: 0, take: 5 });

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(10);
            expect(result.totalPages).toBe(2);
        });

        it('returns empty paginated result when no notes exist', async () => {
            vi.mocked(repo.findByUserId).mockResolvedValue([]);
            vi.mocked(repo.countByUserId).mockResolvedValue(0);

            const result = await service.getUserNotes('user-id-1');

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.totalPages).toBe(1);
        });

        it('throws ValidationError when userId is empty', async () => {
            await expect(service.getUserNotes('')).rejects.toThrow(ValidationError);
        });
    });

    // ------------------------------------------------------------------
    describe('searchUserNotes', () => {
        it('returns paginated search results', async () => {
            const notes = [makeNote()];
            vi.mocked(repo.searchByUserId).mockResolvedValue(notes);
            vi.mocked(repo.countSearchByUserId).mockResolvedValue(1);

            const result = await service.searchUserNotes('user-id-1', 'Test', { skip: 0, take: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('throws ValidationError when userId is empty', async () => {
            await expect(service.searchUserNotes('', 'query')).rejects.toThrow(ValidationError);
        });

        it('throws ValidationError when query is empty', async () => {
            await expect(service.searchUserNotes('user-id-1', '')).rejects.toThrow(ValidationError);
        });

        it('throws ValidationError when query is only whitespace', async () => {
            await expect(service.searchUserNotes('user-id-1', '   ')).rejects.toThrow(ValidationError);
        });
    });

    // ------------------------------------------------------------------
    describe('getNoteById', () => {
        it('returns NoteResponseDTO for the note owner', async () => {
            const note = makeNote();
            vi.mocked(repo.findById).mockResolvedValue(note);
            vi.mocked(repo.findByIdAndUserId).mockResolvedValue(note);

            const result = await service.getNoteById('user-id-1', 'note-id-1');

            expect(result.id).toBe('note-id-1');
        });

        it('throws NotFoundError when note does not exist', async () => {
            vi.mocked(repo.findById).mockResolvedValue(null);

            await expect(service.getNoteById('user-id-1', 'missing-note')).rejects.toThrow(NotFoundError);
        });

        it('throws AuthorizationError when caller does not own the note', async () => {
            const note = makeNote({ userId: 'other-user-id' });
            vi.mocked(repo.findById).mockResolvedValue(note);

            await expect(service.getNoteById('user-id-1', 'note-id-1')).rejects.toThrow(AuthorizationError);
        });

        it('throws ValidationError when userId or noteId is missing', async () => {
            await expect(service.getNoteById('', 'note-id-1')).rejects.toThrow(ValidationError);
            await expect(service.getNoteById('user-id-1', '')).rejects.toThrow(ValidationError);
        });
    });

    // ------------------------------------------------------------------
    describe('updateNote', () => {
        it('returns updated NoteResponseDTO', async () => {
            const existing = makeNote();
            const updated = makeNote({ title: 'New Title' });
            vi.mocked(repo.findById).mockResolvedValue(existing);
            vi.mocked(repo.update).mockResolvedValue(updated);

            const result = await service.updateNote('user-id-1', 'note-id-1', { title: 'New Title' });

            expect(result.title).toBe('New Title');
        });

        it('throws ValidationError when no fields are provided', async () => {
            const note = makeNote();
            vi.mocked(repo.findById).mockResolvedValue(note);

            await expect(service.updateNote('user-id-1', 'note-id-1', {})).rejects.toThrow(ValidationError);
        });

        it('throws NotFoundError when note does not exist', async () => {
            vi.mocked(repo.findById).mockResolvedValue(null);

            await expect(
                service.updateNote('user-id-1', 'missing-note', { title: 'x' }),
            ).rejects.toThrow(NotFoundError);
        });

        it('throws AuthorizationError when caller does not own the note', async () => {
            const note = makeNote({ userId: 'other-user-id' });
            vi.mocked(repo.findById).mockResolvedValue(note);

            await expect(
                service.updateNote('user-id-1', 'note-id-1', { title: 'x' }),
            ).rejects.toThrow(AuthorizationError);
        });

        it('throws ValidationError when userId or noteId is empty', async () => {
            await expect(service.updateNote('', 'note-id-1', { title: 'x' })).rejects.toThrow(ValidationError);
        });
    });

    // ------------------------------------------------------------------
    describe('deleteNote', () => {
        it('resolves without error for the note owner', async () => {
            const note = makeNote();
            vi.mocked(repo.findById).mockResolvedValue(note);
            vi.mocked(repo.delete).mockResolvedValue(note);

            await expect(service.deleteNote('user-id-1', 'note-id-1')).resolves.toBeUndefined();
            expect(repo.delete).toHaveBeenCalledWith('note-id-1');
        });

        it('throws AuthorizationError when caller does not own the note', async () => {
            const note = makeNote({ userId: 'other-user-id' });
            vi.mocked(repo.findById).mockResolvedValue(note);

            await expect(service.deleteNote('user-id-1', 'note-id-1')).rejects.toThrow(AuthorizationError);
        });

        it('throws ValidationError when userId or noteId is empty', async () => {
            await expect(service.deleteNote('', 'note-id-1')).rejects.toThrow(ValidationError);
            await expect(service.deleteNote('user-id-1', '')).rejects.toThrow(ValidationError);
        });
    });

    // ------------------------------------------------------------------
    describe('validateNoteOwnership', () => {
        it('resolves without error when user owns the note', async () => {
            vi.mocked(repo.findById).mockResolvedValue(makeNote());
            await expect(service.validateNoteOwnership('user-id-1', 'note-id-1')).resolves.toBeUndefined();
        });

        it('throws NotFoundError (404) when note does not exist', async () => {
            vi.mocked(repo.findById).mockResolvedValue(null);

            const err = await service.validateNoteOwnership('user-id-1', 'missing').catch((e) => e);
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.statusCode).toBe(404);
        });

        it('throws AuthorizationError (403) when note exists but belongs to another user', async () => {
            vi.mocked(repo.findById).mockResolvedValue(makeNote({ userId: 'other-user' }));

            const err = await service.validateNoteOwnership('user-id-1', 'note-id-1').catch((e) => e);
            expect(err).toBeInstanceOf(AuthorizationError);
            expect(err.statusCode).toBe(403);
        });

        it('distinguishes 404 from 403 — not found vs wrong owner', async () => {
            // 404 path
            vi.mocked(repo.findById).mockResolvedValue(null);
            const notFoundErr = await service.validateNoteOwnership('u', 'n').catch((e) => e);
            expect(notFoundErr.statusCode).toBe(404);

            // 403 path
            vi.mocked(repo.findById).mockResolvedValue(makeNote({ userId: 'other' }));
            const forbiddenErr = await service.validateNoteOwnership('u', 'n').catch((e) => e);
            expect(forbiddenErr.statusCode).toBe(403);
        });
    });
});
