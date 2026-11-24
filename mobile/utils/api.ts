import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://faceforge.onrender.com/api';

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Gets the JWT auth token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch (err) {
    return null;
  }
}

/**
 * Sets the JWT auth token
 */
export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token);
}

/**
 * Clears the JWT auth token
 */
export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token');
}

/**
 * Core Request Fetcher with built-in Auth Header, JSON Parsing, and Zod Validation
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    let data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: data?.error || data?.message || 'An error occurred during the request.',
        data: data,
      };
    }

    // Runtime type-safety validation via Zod
    if (schema && data) {
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        console.error('[API Zod Validation Error]:', parsed.error);
        return {
          success: false,
          statusCode: response.status,
          error: 'Server returned unexpected data structure.',
        };
      }
      data = parsed.data;
    }

    return {
      success: true,
      statusCode: response.status,
      data: data as T,
    };
  } catch (error: any) {
    console.error(`[API Fetch Error - ${endpoint}]:`, error);
    return {
      success: false,
      statusCode: 500,
      error: error.message || 'Network error occurred.',
    };
  }
}

/**
 * Pre-configured methods for common CRUD
 */
export const api = {
  get: <T>(endpoint: string, schema?: z.ZodType<T>, headers?: Record<string, string>) => 
    fetchApi<T>(endpoint, { method: 'GET', headers }, schema),
    
  post: <T>(endpoint: string, body?: any, schema?: z.ZodType<T>, headers?: Record<string, string>) => 
    fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body), headers }, schema),
    
  put: <T>(endpoint: string, body?: any, schema?: z.ZodType<T>, headers?: Record<string, string>) => 
    fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), headers }, schema),
    
  delete: <T>(endpoint: string, schema?: z.ZodType<T>, headers?: Record<string, string>) => 
    fetchApi<T>(endpoint, { method: 'DELETE', headers }, schema),
};
