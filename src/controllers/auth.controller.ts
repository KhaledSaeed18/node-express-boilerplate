/*
 * src/controllers/auth.controller.ts
 * This file contains the AuthController class which handles user authentication operations.
 * It includes methods for signing up, signing in, refreshing access tokens, and logging out.
 * It uses the IAuthService interface to interact with the authentication service.
 */

import type { NextFunction, Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../errors';
import { config } from '../config/env';
import type { IAuthService } from '../services';
import { BaseController } from './base.controller';

export interface IAuthController {
    signUp(req: Request, res: Response, next: NextFunction): Promise<void>;
    signIn(req: Request, res: Response, next: NextFunction): Promise<void>;
    refreshAccessToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: Request, res: Response, next: NextFunction): void;
}

export class AuthController extends BaseController implements IAuthController {
    private authService: IAuthService;

    constructor(authService: IAuthService) {
        super();
        this.authService = authService;
    }

    /**
     * Handles user sign-up.
     * Validates the request, calls the authService to create a new user, and sends a response.
     */
    public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body as { email: string; password: string };

            const result = await this.authService.signUp({ email, password });

            this.sendResponse(res, 201, 'User created successfully', result.user);
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Handles user sign-in.
     * Validates the request, calls the authService to authenticate the user, and sets cookies for access and refresh tokens.
     */
    public signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body as { email: string; password: string };

            const result = await this.authService.signIn({ email, password });

            if (!result.accessToken || !result.refreshToken) {
                next(new AppError('Token generation failed', 500));
                return;
            }

            // Set cookies
            this.setCookie(res, 'accessToken', result.accessToken, 15 * 60 * 1000); // 15 minutes
            this.setCookie(res, 'refreshToken', result.refreshToken, 5 * 60 * 60 * 1000); // 5 hours

            this.sendResponse(res, 200, 'Sign in successful', result.user);
        } catch (error) {
            this.handleError(error, next);
        }
    };

    /**
     * Refreshes the access token using the refresh token stored in cookies.
     * Validates the refresh token, calls the authService to refresh the token, and sets a new access token cookie.
     */
    public refreshAccessToken = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const refreshToken = req.signedCookies.refreshToken as string | false | undefined;

            if (!refreshToken) {
                next(new AppError('Refresh token is required', 401));
                return;
            }

            const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as jwt.JwtPayload;

            // The JWT was signed with { userId } — cast the index-signature access explicitly.
            const { userId } = decoded as unknown as { userId: string };

            const result = await this.authService.refreshToken(userId);

            this.setCookie(res, 'accessToken', result.accessToken, 15 * 60 * 1000); // 15 minutes

            this.sendResponse(res, 200, 'Token refreshed successfully', {
                accessToken: result.accessToken,
            });
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                next(new AppError('Refresh token expired', 401));
                return;
            }
            this.handleError(error, next);
        }
    };

    /**
     * Logs out the user by clearing the access and refresh token cookies.
     * Sends a response indicating successful logout.
     */
    public logout = (_req: Request, res: Response, next: NextFunction): void => {
        try {
            this.clearCookie(res, 'accessToken');
            this.clearCookie(res, 'refreshToken');

            this.sendResponse(res, 200, 'Logged out successfully');
        } catch (error) {
            this.handleError(error, next);
        }
    };
}
