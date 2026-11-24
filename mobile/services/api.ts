import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from './secureStore';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://faceforge.onrender.com';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3005`;
    }
  }

  return 'https://faceforge.onrender.com';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const jwtToken = await SecureStore.getItemAsync('user_session_token');
      if (jwtToken && config.headers) {
        config.headers.Authorization = `Bearer ${jwtToken}`;
      }
    } catch (err) {
      console.error('[API Interceptor] Failed to fetch auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn('[API Interceptor] Request timed out.');
    } else if (!error.response) {
      console.warn('[API Interceptor] Network connection offline or unreachable.');
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return String(error.response.data.error);
    }
    if (error.response?.data?.message) {
      return String(error.response.data.message);
    }
    if (error.response?.status === 401) {
      return 'Session expired. Please log in again.';
    }
    if (error.response?.status === 402) {
      return 'Generation credit limit reached. Please upgrade to Pro or watch an ad.';
    }
    if (error.response?.status === 429) {
      return 'Rate limit exceeded. Please wait a few seconds and try again.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Connection timed out. Please check your internet connection.';
    }
    if (!error.response) {
      return 'Network offline. Unable to connect to server.';
    }
  }
  return error?.message || 'An unexpected error occurred. Please try again.';
}

export default api;
