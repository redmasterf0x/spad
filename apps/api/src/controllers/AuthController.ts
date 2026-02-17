import { Router, Request, Response, NextFunction } from 'express';
import { AuthService, RegisterRequest, LoginRequest } from '../services/AuthService';
import Joi from 'joi';

const router = Router();
const authService = new AuthService();

/**
 * Validation schemas
 */
const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(12).required(),
  givenName: Joi.string().max(100).required(),
  familyName: Joi.string().max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
  totp: Joi.string().length(6).optional(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const twoFactorSetupSchema = Joi.object({
  confirmed: Joi.boolean().required(),
});

const twoFactorConfirmSchema = Joi.object({
  secret: Joi.string().required(),
  totp: Joi.string().length(6).required(),
});

const passwordChangeSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(12).required(),
});

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.register(value as RegisterRequest);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Login user with email/password (+ optional 2FA)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.login(value as LoginRequest);
    res.status(200).json(result);
  } catch (err) {
    if ((err as Error).message === '2FA required') {
      return res.status(401).json({ error: '2FA required' });
    }
    next(err);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = refreshSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.refreshToken(value.refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/2fa/setup
 * Initiate 2FA setup (TOTP)
 * Requires authenticated user (bearer token)
 */
router.post('/2fa/setup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract userId from token (set by auth middleware)
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await authService.setupTwoFactor(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/2fa/confirm
 * Confirm 2FA setup with TOTP code
 * Requires authenticated user (bearer token)
 */
router.post('/2fa/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = twoFactorConfirmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await authService.confirmTwoFactor(userId, value.secret, value.totp);
    res.status(200).json({ message: '2FA enabled successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/password/change
 * Change password
 * Requires authenticated user (bearer token)
 */
router.post('/password/change', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = passwordChangeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await authService.changePassword(userId, value.oldPassword, value.newPassword);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/password/reset-request
 * Request password reset (sends email)
 */
router.post('/password/reset-request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailSchema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.requestPasswordReset(value.email);
    // Always return success to avoid email enumeration
    res.status(200).json({ message: 'If email exists, reset link sent' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/password/reset-confirm
 * Confirm password reset with token
 */
router.post('/password/reset-confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resetSchema = Joi.object({
      resetToken: Joi.string().required(),
      newPassword: Joi.string().min(12).required(),
    });

    const { error, value } = resetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await authService.confirmPasswordReset(value.resetToken, value.newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
