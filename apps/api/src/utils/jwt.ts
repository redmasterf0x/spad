import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

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
export function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('JWT_PRIVATE_KEY not configured');
  }

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Sign a refresh token (long-lived, 7 days)
 * Uses RS256 algorithm (asymmetric)
 */
export function signRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('JWT_PRIVATE_KEY not configured');
  }

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify a JWT token (access or refresh)
 * Uses RS256 algorithm (asymmetric)
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  const publicKey = process.env.JWT_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('JWT_PUBLIC_KEY not configured');
  }

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Check if a token is expired without throwing
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded.payload === 'string') {
      return true;
    }

    const payload = decoded.payload as any;
    if (!payload.exp) {
      return true;
    }

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiryTime;
  } catch {
    return true;
  }
}

/**
 * Extract userId from token without verification
 * Used for logging/monitoring (dangerous - never trust in security checks)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Generate a pair of ES256 keys (for development testing)
 * In production, use external key management service (AWS KMS, HashiCorp Vault, etc.)
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  // This is a placeholder - in real implementation, use 'crypto' or 'openssl'
  throw new Error('Use openssl to generate RS256 keys: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem');
}
