"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyToken = verifyToken;
exports.isTokenExpired = isTokenExpired;
exports.extractUserIdFromToken = extractUserIdFromToken;
exports.generateKeyPair = generateKeyPair;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
/**
 * Sign an access token (short-lived, 15 minutes)
 * Uses RS256 algorithm (asymmetric)
 */
function signAccessToken(payload) {
    const privateKey = process.env.JWT_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('JWT_PRIVATE_KEY not configured');
    }
    return jsonwebtoken_1.default.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
}
/**
 * Sign a refresh token (long-lived, 7 days)
 * Uses RS256 algorithm (asymmetric)
 */
function signRefreshToken(payload) {
    const privateKey = process.env.JWT_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('JWT_PRIVATE_KEY not configured');
    }
    return jsonwebtoken_1.default.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
}
/**
 * Verify a JWT token (access or refresh)
 * Uses RS256 algorithm (asymmetric)
 * @throws Error if token is invalid or expired
 */
function verifyToken(token) {
    const publicKey = process.env.JWT_PUBLIC_KEY;
    if (!publicKey) {
        throw new Error('JWT_PUBLIC_KEY not configured');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, publicKey, {
            algorithms: ['RS256'],
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token expired');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        throw error;
    }
}
/**
 * Check if a token is expired without throwing
 */
function isTokenExpired(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
        if (!decoded || typeof decoded.payload === 'string') {
            return true;
        }
        const payload = decoded.payload;
        if (!payload.exp) {
            return true;
        }
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= expiryTime;
    }
    catch {
        return true;
    }
}
/**
 * Extract userId from token without verification
 * Used for logging/monitoring (dangerous - never trust in security checks)
 */
function extractUserIdFromToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded?.userId || null;
    }
    catch {
        return null;
    }
}
/**
 * Generate a pair of ES256 keys (for development testing)
 * In production, use external key management service (AWS KMS, HashiCorp Vault, etc.)
 */
function generateKeyPair() {
    // This is a placeholder - in real implementation, use 'crypto' or 'openssl'
    throw new Error('Use openssl to generate RS256 keys: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem');
}
//# sourceMappingURL=jwt.js.map