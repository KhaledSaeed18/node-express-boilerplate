/*
 * NoteService class for handling note-related operations.
 * It provides methods for creating, retrieving, updating, and deleting notes.
 * It also includes methods for validating note ownership and searching notes.
 * It interacts with the INoteRepository to perform database operations.
 * It throws specific errors for validation, authorization, and not found scenarios.
 */

import type { Note } from '@prisma/client';
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
    deleteNote(userId: string, noteId: string): Promise<NoteResponseDTO>;
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

        // Create note (validation is handled by middleware)
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
        // Validate user ID
        if (!userId) {
            throw new ValidationError('User ID is required');
        }

        // Retrieve notes with pagination
        const [notes, total] = await Promise.all([
            this.noteRepository.findByUserId(userId, pagination),
            this.noteRepository.countByUserId(userId),
        ]);

        // Convert notes to response DTO format
        const notesDTO = notes.map((note) => this.toNoteResponseDTO(note));

        // Return paginated result
        return {
            data: notesDTO,
            total,
            page:
                pagination?.skip && pagination.take
                    ? Math.floor(pagination.skip / pagination.take) + 1
                    : undefined,
            limit: pagination?.take,
            totalPages: pagination?.take ? Math.ceil(total / pagination.take) : undefined,
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
        // Validate user ID and query
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        if (!query || query.trim().length === 0) {
            throw new ValidationError('Search query is required');
        }

        // Sanitize and prepare search query
        const searchQuery = query.trim();

        // Search notes with pagination
        const [notes, total] = await Promise.all([
            this.noteRepository.searchByUserId(userId, searchQuery, pagination),
            this.noteRepository.countSearchByUserId(userId, searchQuery),
        ]);

        // Convert notes to response DTO format
        const notesDTO = notes.map((note) => this.toNoteResponseDTO(note));

        // Return paginated result
        return {
            data: notesDTO,
            total,
            page:
                pagination?.skip && pagination.take
                    ? Math.floor(pagination.skip / pagination.take) + 1
                    : undefined,
            limit: pagination?.take,
            totalPages: pagination?.take ? Math.ceil(total / pagination.take) : undefined,
        };
    }

    /**
     * Retrieves a note by its ID for a user.
     * Validates ownership and returns note in NoteResponseDTO format.
     */
    public async getNoteById(userId: string, noteId: string): Promise<NoteResponseDTO> {
        // Validate user ID and note ID
        if (!userId || !noteId) {
            throw new ValidationError('User ID and Note ID are required');
        }

        // Validate note ownership
        await this.validateNoteOwnership(userId, noteId);

        // Retrieve note by ID and user ID
        const note = await this.noteRepository.findByIdAndUserId(noteId, userId);

        // Check if note exists
        if (!note) {
            throw new NotFoundError('Note not found');
        }

        // Convert note to response DTO format
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
        // Validate user ID and note ID
        if (!userId || !noteId) {
            throw new ValidationError('User ID and Note ID are required');
        }

        // Validate note ownership
        await this.validateNoteOwnership(userId, noteId);

        // Prepare update data (validation is handled by middleware)
        const updateData: UpdateNoteDTO = {};
        if (data.title !== undefined) {
            updateData.title = data.title.trim();
        }
        if (data.content !== undefined) {
            updateData.content = data.content.trim();
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No valid fields to update');
        }

        // Update note
        const updatedNote = await this.noteRepository.update(noteId, updateData);

        // Return updated note in response DTO format
        return this.toNoteResponseDTO(updatedNote);
    }

    /**
     * Deletes a note by its ID for a user.
     * Validates ownership, deletes note, and returns it in NoteResponseDTO format.
     */
    public async deleteNote(userId: string, noteId: string): Promise<NoteResponseDTO> {
        // Validate user ID and note ID
        if (!userId || !noteId) {
            throw new ValidationError('User ID and Note ID are required');
        }

        // Validate note ownership
        await this.validateNoteOwnership(userId, noteId);

        // Check if note exists
        const deletedNote = await this.noteRepository.delete(noteId);

        // Return deleted note in response DTO format
        return this.toNoteResponseDTO(deletedNote);
    }

    /**
     * Validates if a user owns a note by note ID and user ID.
     * Throws NotFoundError if note does not exist or AuthorizationError if user does not own the note.
     */
    public async validateNoteOwnership(userId: string, noteId: string): Promise<void> {
        // Validate user ID and note ID
        const noteExists = await this.noteRepository.noteExists(noteId);
        if (!noteExists) {
            throw new NotFoundError('Note not found');
        }

        // Check if user owns the note
        const userOwnsNote = await this.noteRepository.userOwnsNote(noteId, userId);
        if (!userOwnsNote) {
            throw new AuthorizationError('You do not have permission to access this note');
        }
    }

    /**
     * Converts a Note entity to NoteResponseDTO format.
     * Used for consistent response structure.
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
