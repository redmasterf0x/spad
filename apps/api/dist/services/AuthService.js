"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../utils/jwt");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
    }
    /**
     * Register a new user
     * - Hash password with bcrypt
     * - Create account with ACTIVE status
     * - KYC starts as PENDING (Persona webhook will update)
     */
    async register(req) {
        const { email, password, givenName, familyName } = req;
        // Validate password strength
        if (password.length < 12) {
            throw new Error('Password must be at least 12 characters');
        }
        // Check if email already exists
        const existing = await this.userRepository.findOne({ where: { email } });
        if (existing) {
            throw new Error('Email already registered');
        }
        // Hash password with bcrypt (salt rounds: 12 for moderate security)
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        // Create user
        const user = this.userRepository.create({
            email,
            passwordHash,
            givenName,
            familyName,
            emailVerified: false, // Will be verified via email link
            kycStatus: 'PENDING',
            pepCheckStatus: 'PENDING',
            sanctionsCheckStatus: 'PENDING',
            accountStatus: 'ACTIVE',
        });
        const savedUser = await this.userRepository.save(user);
        // Generate tokens
        const tokenPayload = {
            userId: savedUser.id,
            email: savedUser.email,
            kycStatus: savedUser.kycStatus,
        };
        const accessToken = (0, jwt_1.signAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.signRefreshToken)(tokenPayload);
        return {
            accessToken,
            refreshToken,
            user: {
                id: savedUser.id,
                email: savedUser.email,
                givenName: savedUser.givenName,
                familyName: savedUser.familyName,
                kycStatus: savedUser.kycStatus,
                accountStatus: savedUser.accountStatus,
                twoFactorRequired: !!savedUser.totpSecret,
            },
        };
    }
    /**
     * Login a user
     * - Verify email/password
     * - Check 2FA if enabled
     * - Generate tokens
     */
    async login(req) {
        const { email, password, totp } = req;
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Verify password
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Invalid email or password');
        }
        // Check 2FA if enabled
        if (user.totpSecret) {
            if (!totp) {
                throw new Error('2FA required');
            }
            const isValid = speakeasy_1.default.totp.verify({
                secret: user.totpSecret,
                encoding: 'base32',
                token: totp,
                window: 2, // Allow 30 seconds on either side
            });
            if (!isValid) {
                throw new Error('Invalid 2FA code');
            }
        }
        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            kycStatus: user.kycStatus,
        };
        const accessToken = (0, jwt_1.signAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.signRefreshToken)(tokenPayload);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                givenName: user.givenName,
                familyName: user.familyName,
                kycStatus: user.kycStatus,
                accountStatus: user.accountStatus,
                twoFactorRequired: !!user.totpSecret,
            },
        };
    }
    /**
     * Verify a JWT token and get user info
     */
    async verifyToken(token) {
        const payload = (0, jwt_1.verifyToken)(token);
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        const payload = (0, jwt_1.verifyToken)(refreshToken);
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Generate new tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            kycStatus: user.kycStatus,
        };
        const newAccessToken = (0, jwt_1.signAccessToken)(tokenPayload);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(tokenPayload);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                email: user.email,
                givenName: user.givenName,
                familyName: user.familyName,
                kycStatus: user.kycStatus,
                accountStatus: user.accountStatus,
                twoFactorRequired: !!user.totpSecret,
            },
        };
    }
    /**
     * Setup 2FA (TOTP)
     * Returns QR code that user scans with authenticator app
     */
    async setupTwoFactor(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        // Generate TOTP secret
        const secret = speakeasy_1.default.generateSecret({
            name: `SPAD (${user.email})`,
            issuer: 'SPAD Trading',
        });
        if (!secret.otpauth_url) {
            throw new Error('Failed to generate 2FA secret');
        }
        // Generate QR code
        const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
        return {
            secret: secret.base32 || '',
            qrCode,
        };
    }
    /**
     * Confirm 2FA setup
     * User provides TOTP code to verify they can use their authenticator
     */
    async confirmTwoFactor(userId, secret, totp) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        // Verify TOTP code
        const isValid = speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token: totp,
            window: 2,
        });
        if (!isValid) {
            throw new Error('Invalid 2FA code');
        }
        // Save secret to user
        user.totpSecret = secret;
        await this.userRepository.save(user);
    }
    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        if (newPassword.length < 12) {
            throw new Error('Password must be at least 12 characters');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        // Verify old password
        const passwordMatch = await bcrypt_1.default.compare(oldPassword, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Invalid password');
        }
        // Hash new password
        user.passwordHash = await bcrypt_1.default.hash(newPassword, 12);
        await this.userRepository.save(user);
    }
    /**
     * Request password reset
     * In production: send email with reset link containing token
     */
    async requestPasswordReset(email) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if email exists (security best practice)
            return { resetToken: 'check_email' };
        }
        // Generate a reset token (typically short-lived, 15 minutes)
        const resetToken = (0, jwt_1.signAccessToken)({
            userId: user.id,
            email: user.email,
            kycStatus: user.kycStatus,
        });
        // TODO: In production, send email with /auth/reset-password?token=resetToken
        return { resetToken };
    }
    /**
     * Confirm password reset
     */
    async confirmPasswordReset(resetToken, newPassword) {
        if (newPassword.length < 12) {
            throw new Error('Password must be at least 12 characters');
        }
        const payload = (0, jwt_1.verifyToken)(resetToken);
        const user = await this.userRepository.findOne({ where: { id: payload.userId } });
        if (!user) {
            throw new Error('User not found');
        }
        // Hash new password
        user.passwordHash = await bcrypt_1.default.hash(newPassword, 12);
        await this.userRepository.save(user);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map