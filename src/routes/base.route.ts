/*
 * BaseRoute class for defining common route functionality.
 * This class is intended to be extended by specific route classes.
 * It initializes the router and provides a method to get the router instance.
 * It also initializes the container for dependency injection.
 * It is used to set up routes in the application.
 */

import express, { type Router } from 'express';
import { Container } from '../container';
import prisma from '../database/prismaClient';

export abstract class BaseRoute {
    protected router: Router;
    protected container: Container;

    constructor() {
        this.router = express.Router();
        this.container = Container.getInstance(prisma);
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    protected abstract initializeRoutes(): void;
}
