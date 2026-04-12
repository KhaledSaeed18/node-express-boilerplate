/*
 * src/container/index.ts
 * This file implements the Dependency Injection Container for the application.
 * It manages the instantiation and retrieval of repositories, services, and controllers.
 */

import type { PrismaClient } from '../generated/prisma/client';
import {
    UserRepository,
    NoteRepository,
    type IUserRepository,
    type INoteRepository,
} from '../repository';
import { AuthService, NoteService, type IAuthService, type INoteService } from '../services';
import {
    AuthController,
    NoteController,
    type IAuthController,
    type INoteController,
} from '../controllers';

export interface IContainer {
    getUserRepository(): IUserRepository;
    getNoteRepository(): INoteRepository;
    getAuthService(): IAuthService;
    getNoteService(): INoteService;
    getAuthController(): IAuthController;
    getNoteController(): INoteController;
}

export class Container implements IContainer {
    private static instance: Container | null = null;
    private prisma: PrismaClient;
    private userRepository!: IUserRepository;
    private noteRepository!: INoteRepository;
    private authService!: IAuthService;
    private noteService!: INoteService;
    private authController!: IAuthController;
    private noteController!: INoteController;

    private constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.initializeRepositories();
        this.initializeServices();
        this.initializeControllers();
    }

    // Singleton pattern to ensure only one instance of Container is created
    // This is useful for managing shared resources like PrismaClient
    // and to avoid multiple instances of repositories, services, and controllers
    // This method returns the existing instance or creates a new one if it doesn't exist
    public static getInstance(prisma: PrismaClient): Container {
        return (Container.instance ??= new Container(prisma));
    }

    // Method to reset the singleton instance
    // This can be useful for testing purposes or when you need to reinitialize the container
    public static resetInstance(): void {
        Container.instance = null;
    }

    // Private methods to initialize repositories, services, and controllers
    // These methods are called in the constructor to set up the container
    private initializeRepositories(): void {
        this.userRepository = new UserRepository(this.prisma);
        this.noteRepository = new NoteRepository(this.prisma);
    }

    private initializeServices(): void {
        this.authService = new AuthService(this.userRepository);
        this.noteService = new NoteService(this.noteRepository);
    }

    private initializeControllers(): void {
        this.authController = new AuthController(this.authService);
        this.noteController = new NoteController(this.noteService);
    }

    public getUserRepository(): IUserRepository {
        return this.userRepository;
    }

    public getNoteRepository(): INoteRepository {
        return this.noteRepository;
    }

    public getAuthService(): IAuthService {
        return this.authService;
    }

    public getNoteService(): INoteService {
        return this.noteService;
    }

    public getAuthController(): IAuthController {
        return this.authController;
    }

    public getNoteController(): INoteController {
        return this.noteController;
    }
}

export default Container;
