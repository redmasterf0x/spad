import { User } from '../entities/User';
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
    totp?: string;
}
export declare class AuthService {
    private userRepository;
    /**
     * Register a new user
     * - Hash password with bcrypt
     * - Create account with ACTIVE status
     * - KYC starts as PENDING (Persona webhook will update)
     */
    register(req: RegisterRequest): Promise<AuthResponse>;
    /**
     * Login a user
     * - Verify email/password
     * - Check 2FA if enabled
     * - Generate tokens
     */
    login(req: LoginRequest): Promise<AuthResponse>;
    /**
     * Verify a JWT token and get user info
     */
    verifyToken(token: string): Promise<User>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    /**
     * Setup 2FA (TOTP)
     * Returns QR code that user scans with authenticator app
     */
    setupTwoFactor(userId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    /**
     * Confirm 2FA setup
     * User provides TOTP code to verify they can use their authenticator
     */
    confirmTwoFactor(userId: string, secret: string, totp: string): Promise<void>;
    /**
     * Change password
     */
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    /**
     * Request password reset
     * In production: send email with reset link containing token
     */
    requestPasswordReset(email: string): Promise<{
        resetToken: string;
    }>;
    /**
     * Confirm password reset
     */
    confirmPasswordReset(resetToken: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=AuthService.d.ts.map