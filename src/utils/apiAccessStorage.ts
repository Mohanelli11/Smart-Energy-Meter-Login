/**
 * API Access Storage Utilities
 * Handles persistence for API access requests and keys using localStorage
 */

export interface ApiRequest {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  apiKey?: string;
  notes?: string;
}
const API_REQUESTS_KEY = 'motech_api_requests';

// Get all API requests
export function getApiRequests(): ApiRequest[] {
  try {
    const data = localStorage.getItem(API_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load API requests:', error);
    return [];
  }
}

// Save all API requests
function saveApiRequests(requests: ApiRequest[]): void {
  try {
    localStorage.setItem(API_REQUESTS_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to save API requests:', error);
  }
}

// Create a new API access request
export function createApiRequest(user: {
  email: string;
  name: string;
  id?: string;
}): ApiRequest {
  const requests = getApiRequests();

  // Check if pending request already exists
  const existing = requests.find((r) => r.email === user.email && r.status === 'pending');
  if (existing) return existing;
  const newRequest: ApiRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id || user.email,
    // Fallback to email if no ID
    email: user.email,
    name: user.name,
    status: 'pending',
    requestDate: new Date().toISOString()
  };
  requests.push(newRequest);
  saveApiRequests(requests);
  return newRequest;
}

// Update request status (Approve/Reject)
export function updateApiRequestStatus(requestId: string, status: 'approved' | 'rejected', notes?: string): ApiRequest | null {
  const requests = getApiRequests();
  const requestIndex = requests.findIndex((r) => r.id === requestId);
  if (requestIndex === -1) return null;
  const request = requests[requestIndex];
  request.status = status;
  request.notes = notes;
  if (status === 'approved') {
    // Generate a mock API key
    request.apiKey = `hb_live_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  }
  requests[requestIndex] = request;
  saveApiRequests(requests);
  return request;
}

// Get request by user email
export function getApiRequestByUser(email: string): ApiRequest | undefined {
  const requests = getApiRequests();
  // Return the most recent request or the active one
  return requests.find((r) => r.email === email);
}