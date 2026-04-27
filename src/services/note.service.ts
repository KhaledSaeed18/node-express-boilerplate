/*
 * NoteService class for handling note-related operations.
 * It provides methods for creating, retrieving, updating, and deleting notes.
 * It also includes methods for validating note ownership and searching notes.
 * It interacts with the INoteRepository to perform database operations.
 * It throws specific errors for validation, authorization, and not found scenarios.
 */

import type { Note } from '../generated/prisma/client';
import type { INoteRepository } from '../repository';
import type {
    CreateNoteDTO,
    UpdateNoteDTO,
    NoteResponseDTO,
    PaginationParams,
    PaginatedResult,
} from '../types';
import { NotFoundError, ValidationError, AuthorizationError } from '../errors';

export interface INoteService {
    createNote(userId: string, data: Omit<CreateNoteDTO, 'userId'>): Promise<NoteResponseDTO>;
    getUserNotes(
        userId: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<NoteResponseDTO>>;
    searchUserNotes(
        userId: string,
        query: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<NoteResponseDTO>>;
    getNoteById(userId: string, noteId: string): Promise<NoteResponseDTO>;
    updateNote(userId: string, noteId: string, data: UpdateNoteDTO): Promise<NoteResponseDTO>;
    deleteNote(userId: string, noteId: string): Promise<void>;
    validateNoteOwnership(userId: string, noteId: string): Promise<void>;
}

export class NoteService implements INoteService {
    constructor(private noteRepository: INoteRepository) {}

    /**
     * Creates a new note for the user.
     * Validates input, creates note, and returns it in NoteResponseDTO format.
     */
    public async createNote(
        userId: string,
        data: Omit<CreateNoteDTO, 'userId'>,
    ): Promise<NoteResponseDTO> {
        const { title, content } = data;

        const note = await this.noteRepository.create({
            title: title.trim(),
            content: content.trim(),
            userId,
        });

        return this.toNoteResponseDTO(note);
    }

    /**
     * Retrieves all notes for a user with optional pagination.
     * Returns paginated result of notes in NoteResponseDTO format.
     */
    public async getUserNotes(
        userId: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<NoteResponseDTO>> {
        if (!userId) {
            throw new ValidationError('User ID is required');
        }

        const [notes, total] = await Promise.all([
            this.noteRepository.findByUserId(userId, pagination),
            this.noteRepository.countByUserId(userId),
        ]);

        const notesDTO = notes.map((note) => this.toNoteResponseDTO(note));

        return {
            data: notesDTO,
            total,
            totalPages: pagination?.take ? Math.ceil(total / pagination.take) : 1,
        };
    }

    /**
     * Searches notes for a user by query with optional pagination.
     * Returns paginated result of notes in NoteResponseDTO format.
     */
    public async searchUserNotes(
        userId: string,
        query: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<NoteResponseDTO>> {
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        if (!query || query.trim().length === 0) {
            throw new ValidationError('Search query is required');
        }

        const searchQuery = query.trim();

        const [notes, total] = await Promise.all([
            this.noteRepository.searchByUserId(userId, searchQuery, pagination),
            this.noteRepository.countSearchByUserId(userId, searchQuery),
        ]);

        const notesDTO = notes.map((note) => this.toNoteResponseDTO(note));

        return {
            data: notesDTO,
            total,
            totalPages: pagination?.take ? Math.ceil(total / pagination.take) : 1,
        };
    }

    /**
     * Retrieves a note by its ID for a user.
     * Validates ownership and returns note in NoteResponseDTO format.
     */
    public async getNoteById(userId: string, noteId: string): Promise<NoteResponseDTO> {
        if (!userId || !noteId) {
            throw new ValidationError('User ID and Note ID are required');
        }

        await this.validateNoteOwnership(userId, noteId);

        const note = await this.noteRepository.findByIdAndUserId(noteId, userId);
        if (!note) {
            throw new NotFoundError('Note not found');
        }

        return this.toNoteResponseDTO(note);
    }

    /**
     * Updates a note by its ID for a user.
     * Validates ownership, updates note, and returns it in NoteResponseDTO format.
     */
    public async updateNote(
        userId: string,
        noteId: string,
        data: UpdateNoteDTO,
    ): Promise<NoteResponseDTO> {
        if (!userId || !noteId) {
            throw new ValidationError('User ID and Note ID are required');
        }

        await this.validateNoteOwnership(userId, noteId);

        const updateData: UpdateNoteDTO = {};
        if (data.title !== undefined) {
            updateData.title = data.title.trim();
        }
        if (data.content !== undefined) {
            updateData.content = data.content.trim();
        }

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No valid fields to update');
        }

        const updatedNote = await this.noteRepository.update(noteId, updateData);

        return this.toNoteResponseDTO(updatedNote);
    }

    /**
     * Deletes a note by its ID for a user.
     * Validates ownership and deletes the note. Returns nothing (204 No Content).
     */
    public async deleteNote(userId: string, noteId: string): Promise<void> {
        if (!userId || !noteId) {
            throw new ValidationError('User ID and Note ID are required');
        }

        await this.validateNoteOwnership(userId, noteId);
        await this.noteRepository.delete(noteId);
    }

    /**
     * Validates if a user owns a note.
     * A single DB call fetches the note — distinguishes "not found" from "wrong owner"
     * so callers get the correct 404 vs 403 response.
     */
    public async validateNoteOwnership(userId: string, noteId: string): Promise<void> {
        const note = await this.noteRepository.findById(noteId);
        if (!note) {
            throw new NotFoundError('Note not found');
        }
        if (note.userId !== userId) {
            throw new AuthorizationError('You do not have permission to access this note');
        }
    }

    /**
     * Converts a Note entity to NoteResponseDTO format.
     */
    private toNoteResponseDTO(note: Note): NoteResponseDTO {
        return {
            id: note.id,
            title: note.title,
            content: note.content,
            userId: note.userId,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        };
    }
}
