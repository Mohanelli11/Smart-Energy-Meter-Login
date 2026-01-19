/**
 * API Key Management and Storage
 * Handles API key generation, storage, and access requests
 */

import { logSecurityEvent } from './security';
export interface APIKey {
  id: string;
  userId: string;
  userEmail: string;
  key: string;
  name: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  permissions: string[];
}
export interface APIAccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
const API_KEYS_STORAGE_KEY = 'hydrobox_api_keys';
const API_REQUESTS_STORAGE_KEY = 'hydrobox_api_requests';

/**
 * Generate a secure API key
 */
export function generateAPIKey(): string {
  const prefix = 'hb_live_';
  const length = 32;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return prefix + key;
}

/**
 * Get all API keys
 */
export function getAllAPIKeys(): APIKey[] {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading API keys:', error);
    return [];
  }
}

/**
 * Get API keys for a specific user
 */
export function getUserAPIKeys(userId: string): APIKey[] {
  const allKeys = getAllAPIKeys();
  return allKeys.filter(key => key.userId === userId && key.status === 'active');
}

/**
 * Create a new API key
 */
export function createAPIKey(userId: string, userEmail: string, name: string, permissions: string[] = ['read']): APIKey {
  const apiKey: APIKey = {
    id: crypto.randomUUID(),
    userId,
    userEmail,
    key: generateAPIKey(),
    name,
    status: 'active',
    createdAt: new Date().toISOString(),
    permissions
  };
  const allKeys = getAllAPIKeys();
  allKeys.push(apiKey);
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(allKeys));
  logSecurityEvent('API_KEY_CREATED', {
    userId,
    keyId: apiKey.id,
    name
  });
  return apiKey;
}

/**
 * Revoke an API key
 */
export function revokeAPIKey(keyId: string): boolean {
  const allKeys = getAllAPIKeys();
  const keyIndex = allKeys.findIndex(k => k.id === keyId);
  if (keyIndex === -1) return false;
  allKeys[keyIndex].status = 'revoked';
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(allKeys));
  logSecurityEvent('API_KEY_REVOKED', {
    keyId,
    userId: allKeys[keyIndex].userId
  });
  return true;
}

/**
 * Delete an API key
 */
export function deleteAPIKey(keyId: string): boolean {
  const allKeys = getAllAPIKeys();
  const filteredKeys = allKeys.filter(k => k.id !== keyId);
  if (filteredKeys.length === allKeys.length) return false;
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(filteredKeys));
  logSecurityEvent('API_KEY_DELETED', {
    keyId
  });
  return true;
}

/**
 * Update API key last used timestamp
 */
export function updateAPIKeyLastUsed(keyId: string): void {
  const allKeys = getAllAPIKeys();
  const keyIndex = allKeys.findIndex(k => k.id === keyId);
  if (keyIndex !== -1) {
    allKeys[keyIndex].lastUsed = new Date().toISOString();
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(allKeys));
  }
}

/**
 * Get all API access requests
 */
export function getAllAPIRequests(): APIAccessRequest[] {
  try {
    const stored = localStorage.getItem(API_REQUESTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading API requests:', error);
    return [];
  }
}

/**
 * Get pending API access requests
 */
export function getPendingAPIRequests(): APIAccessRequest[] {
  const allRequests = getAllAPIRequests();
  return allRequests.filter(req => req.status === 'pending');
}

/**
 * Get user's API access requests
 */
export function getUserAPIRequests(userId: string): APIAccessRequest[] {
  const allRequests = getAllAPIRequests();
  return allRequests.filter(req => req.userId === userId);
}

/**
 * Create an API access request
 */
export function createAPIRequest(userId: string, userEmail: string, userName: string, reason: string): APIAccessRequest {
  const request: APIAccessRequest = {
    id: crypto.randomUUID(),
    userId,
    userEmail,
    userName,
    reason,
    status: 'pending',
    requestedAt: new Date().toISOString()
  };
  const allRequests = getAllAPIRequests();
  allRequests.push(request);
  localStorage.setItem(API_REQUESTS_STORAGE_KEY, JSON.stringify(allRequests));
  logSecurityEvent('API_ACCESS_REQUESTED', {
    userId,
    requestId: request.id
  });
  return request;
}

/**
 * Approve an API access request
 */
export function approveAPIRequest(requestId: string, reviewerId: string, keyName: string): APIKey | null {
  const allRequests = getAllAPIRequests();
  const requestIndex = allRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) return null;
  const request = allRequests[requestIndex];
  request.status = 'approved';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewerId;
  localStorage.setItem(API_REQUESTS_STORAGE_KEY, JSON.stringify(allRequests));

  // Create API key for the user
  const apiKey = createAPIKey(request.userId, request.userEmail, keyName, ['read', 'write']);
  logSecurityEvent('API_ACCESS_APPROVED', {
    requestId,
    userId: request.userId,
    reviewerId,
    keyId: apiKey.id
  });
  return apiKey;
}

/**
 * Reject an API access request
 */
export function rejectAPIRequest(requestId: string, reviewerId: string): boolean {
  const allRequests = getAllAPIRequests();
  const requestIndex = allRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) return false;
  allRequests[requestIndex].status = 'rejected';
  allRequests[requestIndex].reviewedAt = new Date().toISOString();
  allRequests[requestIndex].reviewedBy = reviewerId;
  localStorage.setItem(API_REQUESTS_STORAGE_KEY, JSON.stringify(allRequests));
  logSecurityEvent('API_ACCESS_REJECTED', {
    requestId,
    userId: allRequests[requestIndex].userId,
    reviewerId
  });
  return true;
}

/**
 * Check if user has API access
 */
export function hasAPIAccess(userId: string): boolean {
  const userKeys = getUserAPIKeys(userId);
  return userKeys.length > 0;
}

/**
 * Check if user has pending request
 */
export function hasPendingRequest(userId: string): boolean {
  const userRequests = getUserAPIRequests(userId);
  return userRequests.some(req => req.status === 'pending');
}