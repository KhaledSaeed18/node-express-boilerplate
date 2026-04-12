/*
 * BaseService class for common service functionality.
 * This class provides methods for error handling, field validation, string sanitization,
 * and email validation. It is intended to be extended by specific service classes.
 * It uses a custom AppError class for error management.
 */

import { AppError } from '../errors';

export abstract class BaseService {
    // Method to handle errors
    protected handleError(error: unknown): never {
        if (error instanceof AppError) {
            throw error;
        }

        if (error instanceof Error) {
            throw new AppError(error.message, 500);
        }

        throw new AppError('An unexpected error occurred', 500);
    }

    /*
     * Validates required fields in the provided data object.
     * Throws an AppError if any required field is missing.
     */
    protected validateRequiredFields(
        data: Record<string, unknown>,
        requiredFields: string[],
    ): void {
        const missingFields = requiredFields.filter((field) => !data[field]);

        if (missingFields.length > 0) {
            throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
        }
    }

    /*
     * Sanitizes a string by trimming whitespace and replacing multiple spaces with a single space.
     * Returns the sanitized string.
     */
    protected sanitizeString(str: string): string {
        return str.trim().replace(/\s+/g, ' ');
    }

    /*
     * Validates an email address format.
     * Returns true if valid, false otherwise.
     */
    protected isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
