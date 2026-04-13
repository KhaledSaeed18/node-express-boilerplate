/*
 * src/utils/generateToken
 * Utility functions for generating JWT tokens.
 * This module exports functions to generate access and refresh tokens using JSON Web Tokens (JWT).
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

interface Payload {
    userId: string;
}

// SignOptions['expiresIn'] is `number | StringValue` — cast our plain strings to
// that type to satisfy the overload without importing the branded `ms` type.
type JwtExpiry = NonNullable<SignOptions['expiresIn']>;

// Function to generate an access token
// The access token is used for authenticating requests and has a short expiration time
export const generateAccessToken = (userId: string): string => {
    const payload: Payload = { userId };

    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRE_TIME as JwtExpiry,
    });
};

// Function to generate a refresh token
// The refresh token is used to obtain a new access token when the current one expires
// It has a longer expiration time compared to the access token
export const generateRefreshToken = (userId: string): string => {
    const payload: Payload = { userId };

    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRE_TIME as JwtExpiry,
    });
};
