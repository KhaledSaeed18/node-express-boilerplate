/*
 * NoteRepository class for managing notes in the database
 * This class provides methods for creating, finding, updating, and deleting notes,
 * as well as checking ownership and existence of notes.
 */

import type { Note } from '../generated/prisma/client';
import { BaseRepository } from './base.repository';
import type { CreateNoteDTO, UpdateNoteDTO, PaginationParams } from '../types';

export interface INoteRepository {
    create(data: CreateNoteDTO): Promise<Note>;
    findById(id: string): Promise<Note | null>;
    findByIdAndUserId(id: string, userId: string): Promise<Note | null>;
    findByUserId(userId: string, pagination?: PaginationParams): Promise<Note[]>;
    searchByUserId(userId: string, query: string, pagination?: PaginationParams): Promise<Note[]>;
    countByUserId(userId: string): Promise<number>;
    countSearchByUserId(userId: string, query: string): Promise<number>;
    update(id: string, data: UpdateNoteDTO): Promise<Note>;
    delete(id: string): Promise<Note>;
    noteExists(id: string): Promise<boolean>;
    userOwnsNote(noteId: string, userId: string): Promise<boolean>;
}

export class NoteRepository extends BaseRepository implements INoteRepository {
    // Create a new note
    public async create(data: CreateNoteDTO): Promise<Note> {
        return await this.prisma.note.create({
            data,
        });
    }

    // Find a note by its ID
    public async findById(id: string): Promise<Note | null> {
        return await this.prisma.note.findUnique({
            where: { id },
        });
    }

    // Find a note by its ID and user ID
    public async findByIdAndUserId(id: string, userId: string): Promise<Note | null> {
        return await this.prisma.note.findFirst({
            where: {
                id,
                userId,
            },
        });
    }

    // Find notes by user ID with optional pagination
    public async findByUserId(userId: string, pagination?: PaginationParams): Promise<Note[]> {
        return await this.findManyWithPagination<Note>(
            this.prisma.note,
            { userId },
            { createdAt: 'desc' },
            pagination,
        );
    }

    // Search notes by user ID with optional pagination
    public async searchByUserId(
        userId: string,
        query: string,
        pagination?: PaginationParams,
    ): Promise<Note[]> {
        return await this.findManyWithPagination<Note>(
            this.prisma.note,
            {
                userId,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                ],
            },
            { createdAt: 'desc' },
            pagination,
        );
    }

    // Count notes by user ID
    public async countByUserId(userId: string): Promise<number> {
        return await this.count(this.prisma.note, { userId });
    }

    // Count notes by user ID with search query
    public async countSearchByUserId(userId: string, query: string): Promise<number> {
        return await this.count(this.prisma.note, {
            userId,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
            ],
        });
    }

    // Update a note by its ID
    public async update(id: string, data: UpdateNoteDTO): Promise<Note> {
        try {
            return await this.prisma.note.update({
                where: { id },
                data,
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    // Delete a note by its ID
    public async delete(id: string): Promise<Note> {
        try {
            return await this.prisma.note.delete({
                where: { id },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    // Check if a note exists by its ID
    public async noteExists(id: string): Promise<boolean> {
        return await this.exists(this.prisma.note, { id });
    }

    // Check if a user owns a note by note ID and user ID
    public async userOwnsNote(noteId: string, userId: string): Promise<boolean> {
        return await this.exists(this.prisma.note, { id: noteId, userId });
    }
}
