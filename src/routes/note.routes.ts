/*
 * NoteRoute class for defining routes related to notes.
 * This class extends BaseRoute and initializes routes for creating, retrieving,
 * updating, and deleting notes.
 * It uses middleware for rate limiting, pagination, and authentication.
 * It is used to set up note-related routes in the application.
 */

import type { INoteController } from '../controllers';
import { noteLimiter, paginateResults, protect } from '../middleware';
import { createNoteValidation, updateNoteValidation } from '../validations';
import { BaseRoute } from './base.route';

export class NoteRoute extends BaseRoute {
    private noteController!: INoteController;

    protected initializeRoutes(): void {
        // Initialize the controller here, after the container is available
        this.noteController = this.container.getNoteController();

        this.router.post(
            '/',
            noteLimiter,
            protect,
            createNoteValidation(),
            this.noteController.createNote,
        );

        this.router.get('/', noteLimiter, protect, paginateResults, this.noteController.getNotes);

        this.router.get('/:id', noteLimiter, protect, this.noteController.getNote);

        this.router.get(
            '/search',
            noteLimiter,
            protect,
            paginateResults,
            this.noteController.searchNotes,
        );

        this.router.put(
            '/:id',
            noteLimiter,
            protect,
            updateNoteValidation(),
            this.noteController.updateNote,
        );

        this.router.delete('/:id', noteLimiter, protect, this.noteController.deleteNote);
    }
}

// Create instance and export router for backward compatibility
const noteRoute = new NoteRoute();
const noteRoutes = noteRoute.getRouter();

export default noteRoutes;
