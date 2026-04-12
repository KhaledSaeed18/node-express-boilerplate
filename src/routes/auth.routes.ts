/*
 * src/routes/auth.routes.ts
 * This file defines the authentication routes for user signup, signin, token refresh, and logout.
 */

import type { IAuthController } from '../controllers';
import { signupValidation, signinValidation } from '../validations';
import { authLimiter } from '../middleware';
import { BaseRoute } from './base.route';

export class AuthRoute extends BaseRoute {
    private authController!: IAuthController;

    protected initializeRoutes(): void {
        // Initialize the controller here, after the container is available
        this.authController = this.container.getAuthController();

        this.router.post('/signup', authLimiter, signupValidation(), this.authController.signUp);

        this.router.post('/signin', authLimiter, signinValidation(), this.authController.signIn);

        this.router.post('/refresh-token', authLimiter, this.authController.refreshAccessToken);

        this.router.post('/logout', authLimiter, this.authController.logout);
    }
}

// Create instance and export router for backward compatibility
const authRoute = new AuthRoute();
const authRoutes = authRoute.getRouter();

export default authRoutes;
