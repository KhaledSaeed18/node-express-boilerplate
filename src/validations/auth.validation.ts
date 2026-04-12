/*
 * src/validations/auth.validation.ts
 * Validation middleware for authentication routes.
 * This module exports validation functions for user signup and signin requests using express-validator.
 */

import { body, type ValidationChain } from 'express-validator';
import { BLOCKED_DOMAINS, COMMON_PASSWORDS } from '../constants';

// Validation for user signup
// This validation checks the email format, ensures the password meets security requirements,
// and checks for blocked email domains and common passwords
export const signupValidation = (): ValidationChain[] => {
    return [
        body('email')
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail()
            .custom((email: string) => {
                const domain = email.split('@')[1];
                if (BLOCKED_DOMAINS.includes(domain)) {
                    throw new Error('Email domain not allowed');
                }
                return true;
            }),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .isLength({ max: 30 })
            .withMessage('Password must not be more than 30 characters')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/\d/)
            .withMessage('Password must contain at least one number')
            .matches(/[\W_]/)
            .withMessage('Password must contain at least one special character')
            .custom((value: string) => {
                if (COMMON_PASSWORDS.includes(value)) {
                    throw new Error('Password is too common');
                }
                return true;
            }),
    ];
};

// Validation for user signin
// This validation checks that the email and password fields are provided and formatted correctly
// It does not check for blocked domains or common passwords, as those are typically handled during signup
export const signinValidation = (): ValidationChain[] => {
    return [
        body('email')
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required'),
    ];
};
