// Smallcase Gateway JWT Authentication utilities
// Documentation: https://developers.gateway.smallcase.com/docs/getting-started#broker-identification

import { Buffer } from 'buffer'

// Helper function to create JWT without external dependencies
// Note: In production, use a proper JWT library like 'jsonwebtoken'
function createJWT(payload: object, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  const signatureInput = `${base64Header}.${base64Payload}`
  
  // Simple HMAC-SHA256 signature (use proper crypto in production)
  const crypto = require('crypto')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url')
  
  return `${base64Header}.${base64Payload}.${signature}`
}

// Create guest user auth token
export function createGuestAuthToken(secret: string): string {
  const payload = {
    guest: true,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  }
  
  return createJWT(payload, secret)
}

// Create connected user auth token
export function createConnectedAuthToken(smallcaseAuthId: string, secret: string): string {
  const payload = {
    smallcaseAuthId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  }
  
  return createJWT(payload, secret)
}

// Verify JWT token (basic verification)
export function verifyAuthToken(token: string, secret: string): { valid: boolean, payload?: any } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false }
    }

    const [header, payload, signature] = parts
    const signatureInput = `${header}.${payload}`
    
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url')
    
    if (signature !== expectedSignature) {
      return { valid: false }
    }

    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString())
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false }
    }

    return { valid: true, payload: decodedPayload }
  } catch (error) {
    console.error('JWT verification error:', error)
    return { valid: false }
  }
}

// Auth token types
export type AuthTokenType = 'guest' | 'connected'

// Get auth token type from token
export function getAuthTokenType(token: string): AuthTokenType | null {
  const decoded = verifyAuthToken(token, '') // We don't verify signature here, just decode
  if (!decoded.valid && decoded.payload) {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    if (payload.guest) return 'guest'
    if (payload.smallcaseAuthId) return 'connected'
  }
  return null
}

// Configuration for different environments
export const SmallcaseConfig = {
  // Demo/Development configuration
  demo: {
    gatewayName: 'gatewaydemo',
    gatewaySecret: 'gatewayDemo_secret',
    // Demo connected user token
    demoConnectedToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzbWFsbGNhc2VBdXRoSWQiOiI2MzFmYWQwMWQ5ZmU3YmEzNGI2YzBhM2EiLCJleHAiOjE5MDAwMDAwMDB9.-_6ykYyKke4xuKImlYEPTX9fJhLoMU86qMHRX0YY6eA',
    // Demo guest token
    demoGuestToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJndWVzdCI6dHJ1ZSwiZXhwIjoyNTU2MTI0MTk5fQ.PHmNnVVqhtB7sZjo5_VWlOs5p_HQzIr3qaS9CV0kiAo'
  },

  // Production configuration (replace with your actual keys)
  production: {
    gatewayName: process.env.SMALLCASE_GATEWAY_NAME || 'your-gateway-name',
    gatewaySecret: process.env.SMALLCASE_GATEWAY_SECRET || 'your-gateway-secret',
  }
}

// Get current configuration based on environment
export function getSmallcaseConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment ? SmallcaseConfig.demo : SmallcaseConfig.production
}

// Auth flow helpers
export class SmallcaseAuthManager {
  private gatewayName: string
  private gatewaySecret: string

  constructor(gatewayName: string, gatewaySecret: string) {
    this.gatewayName = gatewayName
    this.gatewaySecret = gatewaySecret
  }

  // Create guest token for new users
  createGuestToken(): string {
    return createGuestAuthToken(this.gatewaySecret)
  }

  // Create connected token for returning users
  createConnectedToken(smallcaseAuthId: string): string {
    return createConnectedAuthToken(smallcaseAuthId, this.gatewaySecret)
  }

  // Verify any token
  verifyToken(token: string) {
    return verifyAuthToken(token, this.gatewaySecret)
  }

  // Get token type
  getTokenType(token: string): AuthTokenType | null {
    return getAuthTokenType(token)
  }
}

// Example usage:
// const authManager = new SmallcaseAuthManager('your-gateway', 'your-secret')
// const guestToken = authManager.createGuestToken()
// const connectedToken = authManager.createConnectedToken('user-smallcase-auth-id')