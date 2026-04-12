/*
 * src/utils/generateToken
 * Utility functions for generating JWT tokens.
 * This module exports functions to generate access and refresh tokens using JSON Web Tokens (JWT).
 */

import jwt from 'jsonwebtoken';

interface Payload {
    userId: string;
}

// Function to generate an access token
// The access token is used for authenticating requests and has a short expiration time
export const generateAccessToken = (userId: string): string => {
    const payload: Payload = { userId };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '15m',
    });

    return accessToken;
};

// Function to generate a refresh token
// The refresh token is used to obtain a new access token when the current one expires
// It has a longer expiration time compared to the access token
export const generateRefreshToken = (userId: string): string => {
    const payload: Payload = { userId };

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '5h',
    });

    return refreshToken;
};
