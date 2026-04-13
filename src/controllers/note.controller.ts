/*
 * src/controllers/note.controller.ts
 * This file contains the NoteController class which handles requests related to notes.
 * It includes methods for creating, retrieving, searching, updating, and deleting notes.
 */

import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';
import type { INoteService } from '../services';
import { BaseController } from './base.controller';

export interface INoteController {
    createNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNotes(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchNotes(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteNote(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export class NoteController extends BaseController implements INoteController {
    private noteService: INoteService;

    constructor(noteService: INoteService) {
        super();
        this.noteService = noteService;
    }

    /**
     * Handles note creation.
     * Validates the request, retrieves the user ID, and calls the noteService to create a new note.
     */
    public createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserId(req, next);
            if (!userId) {
                return;
            }

            const { title, content } = req.body as { title: string; content: string };

            const note = await this.noteService.createNote(userId, { title, content });

            this.sendResponse(res, 201, 'Note created successfully', note);
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Retrieves all notes for the authenticated user with pagination.
     * Validates the request, retrieves the user ID, and calls the noteService to get notes.
     */
    public getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserId(req, next);
            if (!userId) {
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const result = await this.noteService.getUserNotes(userId, { skip, take: limit });

            this.sendPaginatedResponse(res, 200, 'Notes retrieved successfully', result.data, {
                currentPage: result.page,
                totalPages: result.totalPages,
                totalItems: result.total,
                itemsPerPage: result.limit,
                hasNext: result.page ? result.page < (result.totalPages ?? 0) : false,
                hasPrev: result.page ? result.page > 1 : false,
            });
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Searches for notes based on a query string.
     * Validates the request, retrieves the user ID, and calls the noteService to search notes.
     */
    public searchNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserId(req, next);
            if (!userId) {
                return;
            }

            const query = req.query.q as string;
            if (!query) {
                next(new AppError('Search query is required', 400));
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const result = await this.noteService.searchUserNotes(userId, query, {
                skip,
                take: limit,
            });

            this.sendPaginatedResponse(
                res,
                200,
                'Notes search completed successfully',
                result.data,
                {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    itemsPerPage: result.limit,
                    hasNext: result.page ? result.page < (result.totalPages ?? 0) : false,
                    hasPrev: result.page ? result.page > 1 : false,
                },
            );
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Retrieves a specific note by its ID.
     * Validates the request, retrieves the user ID, and calls the noteService to get the note.
     */
    public getNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserId(req, next);
            if (!userId) {
                return;
            }

            const rawNoteId = req.params.id;
            const noteId = Array.isArray(rawNoteId) ? rawNoteId[0] : rawNoteId;
            if (!noteId) {
                next(new AppError('Note ID is required', 400));
                return;
            }

            const note = await this.noteService.getNoteById(userId, noteId);

            this.sendResponse(res, 200, 'Note retrieved successfully', note);
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Updates a specific note by its ID.
     * Validates the request, retrieves the user ID, and calls the noteService to update the note.
     */
    public updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserId(req, next);
            if (!userId) {
                return;
            }

            const rawNoteId = req.params.id;
            const noteId = Array.isArray(rawNoteId) ? rawNoteId[0] : rawNoteId;
            if (!noteId) {
                next(new AppError('Note ID is required', 400));
                return;
            }

            const { title, content } = req.body as { title?: string; content?: string };

            const note = await this.noteService.updateNote(userId, noteId, { title, content });

            this.sendResponse(res, 200, 'Note updated successfully', note);
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Deletes a specific note by its ID.
     * Validates the request, retrieves the user ID, and calls the noteService to delete the note.
     */
    public deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserId(req, next);
            if (!userId) {
                return;
            }

            const rawNoteId = req.params.id;
            const noteId = Array.isArray(rawNoteId) ? rawNoteId[0] : rawNoteId;
            if (!noteId) {
                next(new AppError('Note ID is required', 400));
                return;
            }

            const note = await this.noteService.deleteNote(userId, noteId);

            this.sendResponse(res, 200, 'Note deleted successfully', note);
        } catch (error) {
            this.handleError(error, next);
        }
    };
}
