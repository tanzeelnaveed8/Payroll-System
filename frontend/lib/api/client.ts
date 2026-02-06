const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    let response;
    try {
      response = await fetch(`${this.baseURL}${endpoint}`, config);
      clearTimeout(timeoutId);
    } catch (networkError: any) {
      clearTimeout(timeoutId);
      
      // Handle AbortError (timeout)
      if (networkError.name === 'AbortError') {
        throw new Error(
          'Request timed out. The server is taking too long to respond. ' +
          'Please check your connection and try again. If the problem persists, contact support.'
        );
      }
      
      // Handle network errors (connection refused, CORS, etc.)
      const errorMessage = networkError.message || 'Failed to fetch';
      
      // Provide more specific error messages based on error type
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('Network request failed')) {
        // Check if it's a CORS error
        if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
          throw new Error(
            'CORS error: Unable to connect to the server due to cross-origin restrictions. ' +
            'Please contact support to resolve this issue.'
          );
        }
        
        // Check if API URL is configured
        if (!this.baseURL || this.baseURL.includes('localhost:5000') && typeof window !== 'undefined') {
          throw new Error(
            'Unable to connect to the server. Please check:\n\n' +
            '• The backend server is running\n' +
            '• The API URL is correctly configured\n' +
            '• Your internet connection is active\n' +
            '• There are no firewall restrictions\n\n' +
            'If you are a developer, ensure the backend is running on ' + this.baseURL
          );
        }
        
        throw new Error(
          'Unable to connect to the server. Please check:\n\n' +
          '• Your internet connection\n' +
          '• The server is running and accessible\n' +
          '• There are no firewall or network restrictions\n\n' +
          'If the problem persists, please contact support.'
        );
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        throw new Error('Request timed out. Please try again or contact support if the problem persists.');
      }
      
      // Generic network error
      throw new Error(`Network error: ${errorMessage}. Please check your connection and try again.`);
    }

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { 
          message: `HTTP error! status: ${response.status}`,
          status: response.status 
        };
      }
      
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          // Don't redirect on login/register pages or home page
          if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      }
      
      // Return detailed error information
      // If there's a single clear message, use it directly
      if (error.message && (!error.errors || error.errors.length === 0)) {
        throw new Error(error.message);
      }
      
      // For validation errors with multiple fields, format them
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        // If single error, return it directly
        if (error.errors.length === 1) {
          throw new Error(error.errors[0].message || error.message || 'Validation failed');
        }
        // Multiple errors - return formatted message
        const errorMessages = error.errors.map((e: any) => e.message || e.msg).join('. ');
        throw new Error(error.message ? `${error.message}: ${errorMessages}` : errorMessages);
      }
      
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

