"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthService_1 = require("../services/AuthService");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const authService = new AuthService_1.AuthService();
/**
 * Validation schemas
 */
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
    password: joi_1.default.string().min(12).required(),
    givenName: joi_1.default.string().max(100).required(),
    familyName: joi_1.default.string().max(100).required(),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
    password: joi_1.default.string().required(),
    totp: joi_1.default.string().length(6).optional(),
});
const refreshSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required(),
});
const twoFactorSetupSchema = joi_1.default.object({
    confirmed: joi_1.default.boolean().required(),
});
const twoFactorConfirmSchema = joi_1.default.object({
    secret: joi_1.default.string().required(),
    totp: joi_1.default.string().length(6).required(),
});
const passwordChangeSchema = joi_1.default.object({
    oldPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(12).required(),
});
/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const result = await authService.register(value);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/login
 * Login user with email/password (+ optional 2FA)
 */
router.post('/login', async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const result = await authService.login(value);
        res.status(200).json(result);
    }
    catch (err) {
        if (err.message === '2FA required') {
            return res.status(401).json({ error: '2FA required' });
        }
        next(err);
    }
});
/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { error, value } = refreshSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const result = await authService.refreshToken(value.refreshToken);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/2fa/setup
 * Initiate 2FA setup (TOTP)
 * Requires authenticated user (bearer token)
 */
router.post('/2fa/setup', async (req, res, next) => {
    try {
        // Extract userId from token (set by auth middleware)
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await authService.setupTwoFactor(userId);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/2fa/confirm
 * Confirm 2FA setup with TOTP code
 * Requires authenticated user (bearer token)
 */
router.post('/2fa/confirm', async (req, res, next) => {
    try {
        const { error, value } = twoFactorConfirmSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await authService.confirmTwoFactor(userId, value.secret, value.totp);
        res.status(200).json({ message: '2FA enabled successfully' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/password/change
 * Change password
 * Requires authenticated user (bearer token)
 */
router.post('/password/change', async (req, res, next) => {
    try {
        const { error, value } = passwordChangeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await authService.changePassword(userId, value.oldPassword, value.newPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/password/reset-request
 * Request password reset (sends email)
 */
router.post('/password/reset-request', async (req, res, next) => {
    try {
        const emailSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
        });
        const { error, value } = emailSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const result = await authService.requestPasswordReset(value.email);
        // Always return success to avoid email enumeration
        res.status(200).json({ message: 'If email exists, reset link sent' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/password/reset-confirm
 * Confirm password reset with token
 */
router.post('/password/reset-confirm', async (req, res, next) => {
    try {
        const resetSchema = joi_1.default.object({
            resetToken: joi_1.default.string().required(),
            newPassword: joi_1.default.string().min(12).required(),
        });
        const { error, value } = resetSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        await authService.confirmPasswordReset(value.resetToken, value.newPassword);
        res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=AuthController.js.map