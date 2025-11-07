const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// API helper class for making HTTP requests
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get default headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const err = new Error(data.message || `HTTP error! status: ${response.status}`);
        if (data && data.errors) {
          err.errors = data.errors;
        }
        err.status = response.status;
        throw err;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint);
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Authentication methods
  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async updateProfile(userData) {
    return this.put('/auth/profile', userData);
  }

  // Listings methods
  async getListings(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const query = searchParams.toString();
    return this.get(`/listings${query ? `?${query}` : ''}`);
  }

  async getListing(id) {
    return this.get(`/listings/${id}`);
  }

  async createListing(listingData) {
    return this.post('/listings', listingData);
  }

  async updateListing(id, listingData) {
    return this.put(`/listings/${id}`, listingData);
  }

  async deleteListing(id) {
    return this.delete(`/listings/${id}`);
  }

  async getMyListings() {
    return this.get('/listings/owner/me');
  }

  async updateListingStatus(id, statusData) {
    return this.patch(`/listings/${id}/status`, statusData);
  }

  // Conversations methods
  async getConversations() {
    return this.get('/conversations');
  }

  async startConversation(listingOrPayload, participantId) {
    let payload;
    if (listingOrPayload && typeof listingOrPayload === 'object' && !Array.isArray(listingOrPayload)) {
      payload = { ...listingOrPayload };
    } else {
      payload = {};
      if (listingOrPayload) {
        payload.listingId = listingOrPayload;
      }
      if (participantId) {
        payload.participantId = participantId;
      }
    }

    return this.post('/conversations', payload);
  }

  async getConversationMessages(conversationId, params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value);
      }
    });
    const query = search.toString();
    return this.get(`/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  }

  async sendConversationMessage(conversationId, body) {
    return this.post(`/conversations/${conversationId}/messages`, { body });
  }

  async markConversationRead(conversationId) {
    return this.post(`/conversations/${conversationId}/read`, {});
  }

  // Bookings methods
  async getBookings() {
    return this.get('/bookings');
  }

  async getLandlordBookings() {
    return this.get('/bookings/landlord');
  }

  async getBooking(id) {
    return this.get(`/bookings/${id}`);
  }

  async createBooking(bookingData) {
    return this.post('/bookings', bookingData);
  }

  async updateBookingStatus(id, statusData) {
    return this.put(`/bookings/${id}/status`, statusData);
  }

  async cancelBooking(id) {
    return this.put(`/bookings/${id}/cancel`);
  }

  // Roommate requests methods
  async getRoommateRequests(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const query = searchParams.toString();
    return this.get(`/roommates${query ? `?${query}` : ''}`);
  }

  async getRoommateRequest(id) {
    return this.get(`/roommates/${id}`);
  }

  async getMyRoommateRequests() {
    return this.get('/roommates/my-requests');
  }

  async createRoommateRequest(requestData) {
    return this.post('/roommates', requestData);
  }

  async updateRoommateRequest(id, requestData) {
    return this.put(`/roommates/${id}`, requestData);
  }

  async deleteRoommateRequest(id) {
    return this.delete(`/roommates/${id}`);
  }

  async getRoommateReviews(roommateRequestId) {
    return this.get(`/roommates/${roommateRequestId}/reviews`);
  }

  async createRoommateReview(roommateRequestId, reviewData) {
    return this.post(`/roommates/${roommateRequestId}/reviews`, reviewData);
  }

  async updateRoommateReview(roommateRequestId, reviewId, reviewData) {
    return this.put(`/roommates/${roommateRequestId}/reviews/${reviewId}`, reviewData);
  }

  async deleteRoommateReview(roommateRequestId, reviewId) {
    return this.delete(`/roommates/${roommateRequestId}/reviews/${reviewId}`);
  }

  // Users methods
  async getUserProfile(id) {
    return this.get(`/users/${id}`);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;