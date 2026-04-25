/*
 * AuthService class for handling user authentication.
 * It provides methods for signing up, signing in, refreshing tokens, and validating users.
 * It uses bcrypt for password hashing and JWT for token generation.
 * It interacts with the IUserRepository to perform database operations.
 * It throws specific errors for validation, authentication, and conflict scenarios.
 */

import bcrypt from 'bcryptjs';
import type { User } from '../generated/prisma/client';
import type { IUserRepository } from '../repository';
import { generateAccessToken, generateRefreshToken, generateUniqueUsername } from '../utils';
import type {
    SignUpDTO,
    SignInDTO,
    AuthResponseDTO,
    SignUpResponseDTO,
    UserResponseDTO,
} from '../types';
import { ConflictError, AuthenticationError, NotFoundError, ValidationError } from '../errors';
import { config } from '../config/env';

export interface IAuthService {
    signUp(data: SignUpDTO): Promise<SignUpResponseDTO>;
    signIn(data: SignInDTO): Promise<AuthResponseDTO>;
    refreshToken(userId: string): Promise<{ accessToken: string }>;
    validateUser(userId: string): Promise<UserResponseDTO>;
}

export class AuthService implements IAuthService {
    constructor(private userRepository: IUserRepository) {}

    /**
     * Signs up a new user.
     * Checks for existing user, hashes password, and creates user.
     * Returns user data without tokens — clients must sign in to receive tokens.
     */
    public async signUp(data: SignUpDTO): Promise<SignUpResponseDTO> {
        const { email, password } = data;

        // Check if user already exists
        const userExists = await this.userRepository.emailExists(email);
        if (userExists) {
            throw new ConflictError('User already exists');
        }

        // Generate unique username
        const emailPrefix = email.split('@')[0];
        const username = await generateUniqueUsername(emailPrefix, this.userRepository);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

        // Create user
        const user = await this.userRepository.create({
            email,
            username,
            password: hashedPassword,
        });

        return { user: this.toUserResponseDTO(user) };
    }

    /**
     * Signs in a user.
     * Validates credentials, generates tokens, and returns user data with tokens.
     */
    public async signIn(data: SignInDTO): Promise<AuthResponseDTO> {
        const { email, password } = data;

        // Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        return {
            user: this.toUserResponseDTO(user),
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refreshes the access token for a user.
     * Validates user ID, checks if user exists, and generates a new access token.
     */
    public async refreshToken(userId: string): Promise<{ accessToken: string }> {
        if (!userId) {
            throw new ValidationError('User ID is required');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const accessToken = generateAccessToken(userId);
        return { accessToken };
    }

    /**
     * Validates a user by ID.
     * Checks if user exists and returns user data in UserResponseDTO format.
     */
    public async validateUser(userId: string): Promise<UserResponseDTO> {
        if (!userId) {
            throw new ValidationError('User ID is required');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.toUserResponseDTO(user);
    }

    /**
     * Converts a User entity to UserResponseDTO format.
     */
    private toUserResponseDTO(user: User): UserResponseDTO {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
