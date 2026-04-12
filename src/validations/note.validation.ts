/*
 * src/validations/note.validation.ts
 * Validation middleware for note routes.
 * This module exports validation functions for creating and updating notes using express-validator.
 */

import { body, type ValidationChain } from 'express-validator';

// Validation for creating a note
// This validation checks that the title and content fields are provided and formatted correctly
// It ensures that the title is a string, not empty, and within a specified length
export const createNoteValidation = (): ValidationChain[] => {
    return [
        body('title')
            .exists()
            .withMessage('Title is required')
            .isString()
            .withMessage('Title must be a string')
            .notEmpty()
            .withMessage('Title cannot be empty')
            .isLength({ min: 1, max: 255 })
            .withMessage('Title must be between 1 and 255 characters')
            .trim(),
        body('content')
            .exists()
            .withMessage('Content is required')
            .isString()
            .withMessage('Content must be a string')
            .notEmpty()
            .withMessage('Content cannot be empty')
            .isLength({ min: 1 })
            .withMessage('Content must not be empty')
            .trim(),
    ];
};

// Validation for updating a note
// This validation allows the title and content fields to be optional
// It checks that if they are provided, they meet the same criteria as for creating a note
export const updateNoteValidation = (): ValidationChain[] => {
    return [
        body('title')
            .optional()
            .isString()
            .withMessage('Title must be a string')
            .notEmpty()
            .withMessage('Title cannot be empty')
            .isLength({ min: 1, max: 255 })
            .withMessage('Title must be between 1 and 255 characters')
            .trim(),
        body('content')
            .optional()
            .isString()
            .withMessage('Content must be a string')
            .notEmpty()
            .withMessage('Content cannot be empty')
            .isLength({ min: 1 })
            .withMessage('Content must not be empty')
            .trim(),
    ];
};
