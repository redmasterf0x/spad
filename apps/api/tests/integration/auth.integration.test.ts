import { AuthService } from '../../src/services/AuthService';
import { AppDataSource } from '../../src/config/database';
import { User } from '../../src/entities/User';
import { resetDatabase } from '../setup';
import { verifyToken } from '../../src/utils/jwt';
import bcrypt from 'bcrypt';

describe('Step 2: Authentication Service', () => {
  let authService: AuthService;
  let userRepository: any;

  beforeEach(async () => {
    await resetDatabase();
    authService = new AuthService();
    userRepository = AppDataSource.getRepository(User);
  });

  describe('Step 2.1: User Registration', () => {
    it('should register a new user with valid credentials', async () => {
      const result = await authService.register({
        email: 'alice@test.com',
        password: 'SecurePassword123!',
        givenName: 'Alice',
        familyName: 'Smith',
      });

      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe('alice@test.com');
      expect(result.user.kycStatus).toBe('PENDING');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should hash password with bcrypt', async () => {
      const password = 'SecurePassword123!';

      await authService.register({
        email: 'bob@test.com',
        password,
        givenName: 'Bob',
        familyName: 'Jones',
      });

      const user = await userRepository.findOne({ where: { email: 'bob@test.com' } });

      // Password should be hashed (not plaintext)
      expect(user.passwordHash).not.toBe(password);
      expect(user.passwordHash.length).toBeGreaterThan(20); // bcrypt hash is ~60 chars

      // Verify bcrypt hash
      const matches = await bcrypt.compare(password, user.passwordHash);
      expect(matches).toBe(true);
    });

    it('should reject weak passwords', async () => {
      await expect(
        authService.register({
          email: 'weak@test.com',
          password: 'weak', // Too short
          givenName: 'Weak',
          familyName: 'Password',
        })
      ).rejects.toThrow('Password must be at least 12 characters');
    });

    it('should prevent duplicate email registration', async () => {
      const email = 'duplicate@test.com';

      await authService.register({
        email,
        password: 'SecurePassword123!',
        givenName: 'First',
        familyName: 'User',
      });

      await expect(
        authService.register({
          email,
          password: 'DifferentPassword456!',
          givenName: 'Second',
          familyName: 'User',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should return access and refresh tokens on registration', async () => {
      const result = await authService.register({
        email: 'tokens@test.com',
        password: 'SecurePassword123!',
        givenName: 'Token',
        familyName: 'Test',
      });

      // Verify access token
      const accessPayload = verifyToken(result.accessToken);
      expect(accessPayload.userId).toBe(result.user.id);
      expect(accessPayload.email).toBe('tokens@test.com');
      expect(accessPayload.kycStatus).toBe('PENDING');

      // Verify refresh token
      const refreshPayload = verifyToken(result.refreshToken);
      expect(refreshPayload.userId).toBe(result.user.id);
    });
  });

  describe('Step 2.2: User Login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'login@test.com',
        password: 'LoginPassword123!',
        givenName: 'Login',
        familyName: 'Test',
      });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        email: 'login@test.com',
        password: 'LoginPassword123!',
      });

      expect(result.user.email).toBe('login@test.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@test.com',
          password: 'LoginPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      await expect(
        authService.login({
          email: 'login@test.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should return valid tokens on login', async () => {
      const result = await authService.login({
        email: 'login@test.com',
        password: 'LoginPassword123!',
      });

      const payload = verifyToken(result.accessToken);
      expect(payload.userId).toBeDefined();
      expect(payload.email).toBe('login@test.com');
    });
  });

  describe('Step 2.3: Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'refresh@test.com',
        password: 'RefreshPassword123!',
        givenName: 'Refresh',
        familyName: 'Test',
      });
      refreshToken = result.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('refresh@test.com');
    });

    it('should return new tokens different from original', async () => {
      const originalResult = await authService.register({
        email: 'new-user@test.com',
        password: 'NewPassword123!',
        givenName: 'New',
        familyName: 'User',
      });

      const refreshResult = await authService.refreshToken(originalResult.refreshToken);

      expect(refreshResult.accessToken).not.toBe(originalResult.accessToken);
      expect(refreshResult.refreshToken).not.toBe(originalResult.refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      await expect(
        authService.refreshToken('invalid.token.here')
      ).rejects.toThrow();
    });

    it('should reject expired refresh token', async () => {
      const expiredRefreshToken =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';

      await expect(
        authService.refreshToken(expiredRefreshToken)
      ).rejects.toThrow();
    });
  });

  describe('Step 2.4: Two-Factor Authentication (2FA)', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: '2fa@test.com',
        password: 'TwoFactorPassword123!',
        givenName: '2FA',
        familyName: 'Test',
      });
      userId = result.user.id;
    });

    it('should setup 2FA and return QR code', async () => {
      const setup = await authService.setupTwoFactor(userId);

      expect(setup.secret).toBeDefined();
      expect(setup.secret.length).toBeGreaterThan(10); // Base32 encoded
      expect(setup.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should confirm 2FA with valid TOTP code', async () => {
      // Note: This is a simplified test. In reality, you'd:
      // 1. Setup 2FA
      // 2. Get the secret
      // 3. Generate valid TOTP code using speakeasy
      // 4. Confirm with that code

      const { secret } = await authService.setupTwoFactor(userId);

      // Generate a TOTP code (this will pass if speakeasy works correctly)
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Should not throw
      await authService.confirmTwoFactor(userId, secret, token);

      // Verify 2FA is now enabled
      const user = await userRepository.findOne({ where: { id: userId } });
      expect(user.totpSecret).toBe(secret);
    });

    it('should reject invalid TOTP code during confirmation', async () => {
      const { secret } = await authService.setupTwoFactor(userId);

      await expect(
        authService.confirmTwoFactor(userId, secret, '000000')
      ).rejects.toThrow('Invalid 2FA code');
    });

    it('should require 2FA code during login', async () => {
      // Setup 2FA for user
      const { secret } = await authService.setupTwoFactor(userId);
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });
      await authService.confirmTwoFactor(userId, secret, token);

      // Try login without 2FA
      await expect(
        authService.login({
          email: '2fa@test.com',
          password: 'TwoFactorPassword123!',
        })
      ).rejects.toThrow('2FA required');

      // Try login with invalid 2FA
      await expect(
        authService.login({
          email: '2fa@test.com',
          password: 'TwoFactorPassword123!',
          totp: '000000',
        })
      ).rejects.toThrow('Invalid 2FA code');

      // Login with correct 2FA
      const newToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const result = await authService.login({
        email: '2fa@test.com',
        password: 'TwoFactorPassword123!',
        totp: newToken,
      });

      expect(result.accessToken).toBeDefined();
    });
  });

  describe('Step 2.5: Password Management', () => {
    let userId: string;
    let password: string;

    beforeEach(async () => {
      password = 'OriginalPassword123!';
      const result = await authService.register({
        email: 'password@test.com',
        password,
        givenName: 'Password',
        familyName: 'Test',
      });
      userId = result.user.id;
    });

    it('should change password successfully', async () => {
      const newPassword = 'NewSecurePassword456!';

      await authService.changePassword(userId, password, newPassword);

      // Old password should no longer work
      await expect(
        authService.login({
          email: 'password@test.com',
          password,
        })
      ).rejects.toThrow('Invalid email or password');

      // New password should work
      const result = await authService.login({
        email: 'password@test.com',
        password: newPassword,
      });

      expect(result.accessToken).toBeDefined();
    });

    it('should reject weak new password', async () => {
      await expect(
        authService.changePassword(userId, password, 'weak')
      ).rejects.toThrow('Password must be at least 12 characters');
    });

    it('should reject wrong old password', async () => {
      await expect(
        authService.changePassword(userId, 'WrongPassword123!', 'NewPassword456!')
      ).rejects.toThrow('Invalid password');
    });

    it('should request password reset', async () => {
      const result = await authService.requestPasswordReset('password@test.com');

      expect(result.resetToken).toBeDefined();
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      const result = await authService.requestPasswordReset('nonexistent@test.com');

      // Should not reveal if email exists
      expect(result.resetToken).toBe('check_email');
    });

    it('should confirm password reset with valid token', async () => {
      const { resetToken } = await authService.requestPasswordReset('password@test.com');
      const newPassword = 'ResetPassword789!';

      await authService.confirmPasswordReset(resetToken, newPassword);

      // New password should work
      const result = await authService.login({
        email: 'password@test.com',
        password: newPassword,
      });

      expect(result.accessToken).toBeDefined();
    });
  });

  describe('Step 2.6: Token Verification', () => {
    it('should verify valid token and return user', async () => {
      const registered = await authService.register({
        email: 'verify@test.com',
        password: 'VerifyPassword123!',
        givenName: 'Verify',
        familyName: 'Test',
      });

      const user = await authService.verifyToken(registered.accessToken);

      expect(user.id).toBe(registered.user.id);
      expect(user.email).toBe('verify@test.com');
    });

    it('should reject invalid token', async () => {
      await expect(
        authService.verifyToken('invalid.token.here')
      ).rejects.toThrow();
    });

    it('should return 401 for non-existent user', async () => {
      // Create token for user that will then be deleted
      // (In real scenario, this tests stale token)
      const registered = await authService.register({
        email: 'deleted@test.com',
        password: 'DeletePassword123!',
        givenName: 'Deleted',
        familyName: 'Test',
      });

      // Delete user
      await userRepository.remove(
        await userRepository.findOne({ where: { id: registered.user.id } })
      );

      // Token should fail
      await expect(
        authService.verifyToken(registered.accessToken)
      ).rejects.toThrow('User not found');
    });
  });
});
