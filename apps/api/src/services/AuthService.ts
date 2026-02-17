import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken, verifyToken, TokenPayload } from '../utils/jwt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    givenName: string;
    familyName: string;
    kycStatus: string;
    accountStatus: string;
    twoFactorRequired: boolean;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp?: string; // Time-based OTP for 2FA
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user
   * - Hash password with bcrypt
   * - Create account with ACTIVE status
   * - KYC starts as PENDING (Persona webhook will update)
   */
  async register(req: RegisterRequest): Promise<AuthResponse> {
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
    const passwordHash = await bcrypt.hash(password, 12);

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

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

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
  async login(req: LoginRequest): Promise<AuthResponse> {
    const { email, password, totp } = req;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    // Check 2FA if enabled
    if (user.totpSecret) {
      if (!totp) {
        throw new Error('2FA required');
      }

      const isValid = speakeasy.totp.verify({
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

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

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
  async verifyToken(token: string): Promise<User> {
    const payload = verifyToken(token);

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
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const payload = verifyToken(refreshToken);

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

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

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
  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `SPAD (${user.email})`,
      issuer: 'SPAD Trading',
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate 2FA secret');
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32 || '',
      qrCode,
    };
  }

  /**
   * Confirm 2FA setup
   * User provides TOTP code to verify they can use their authenticator
   */
  async confirmTwoFactor(userId: string, secret: string, totp: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
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
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
  }

  /**
   * Request password reset
   * In production: send email with reset link containing token
   */
  async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return { resetToken: 'check_email' };
    }

    // Generate a reset token (typically short-lived, 15 minutes)
    const resetToken = signAccessToken({
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
  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    if (newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    const payload = verifyToken(resetToken);

    const user = await this.userRepository.findOne({ where: { id: payload.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
  }
}
