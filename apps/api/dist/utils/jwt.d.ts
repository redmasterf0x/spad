export interface TokenPayload {
    userId: string;
    email: string;
    kycStatus: string;
    iat?: number;
    exp?: number;
}
/**
 * Sign an access token (short-lived, 15 minutes)
 * Uses RS256 algorithm (asymmetric)
 */
export declare function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
/**
 * Sign a refresh token (long-lived, 7 days)
 * Uses RS256 algorithm (asymmetric)
 */
export declare function signRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
/**
 * Verify a JWT token (access or refresh)
 * Uses RS256 algorithm (asymmetric)
 * @throws Error if token is invalid or expired
 */
export declare function verifyToken(token: string): TokenPayload;
/**
 * Check if a token is expired without throwing
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * Extract userId from token without verification
 * Used for logging/monitoring (dangerous - never trust in security checks)
 */
export declare function extractUserIdFromToken(token: string): string | null;
/**
 * Generate a pair of ES256 keys (for development testing)
 * In production, use external key management service (AWS KMS, HashiCorp Vault, etc.)
 */
export declare function generateKeyPair(): {
    privateKey: string;
    publicKey: string;
};
//# sourceMappingURL=jwt.d.ts.map