/*
 * src/utils/error
 * Error handling utilities for the Express App.
 * This module defines custom error classes and a utility function for creating error objects.
 */

interface HttpError extends Error {
    statusCode: number;
}

export const createError = (statusCode: number, message: string | string[]): HttpError => {
    const errorMessage = Array.isArray(message) ? message.join(', ') : message;
    const error = new Error(errorMessage) as HttpError;
    error.statusCode = statusCode;
    return error;
};
