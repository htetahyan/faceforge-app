import api from './api';

export const authApi = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),

  register: (email: string, password: string, displayName?: string) => 
    api.post('/api/auth/register', { email, password, displayName }),

  oauth: (provider: 'google' | 'apple', idToken: string, email?: string, name?: string) => 
    api.post('/api/auth/oauth', { provider, idToken, email, name }),

  getCurrentUser: (token: string) => 
    api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),

  verifyEmail: (otp: string) => 
    api.post('/api/auth/verify-email', { otp }),

  resendVerification: () => 
    api.post('/api/auth/resend-verification'),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { email, otp, newPassword }),
};

export default authApi;
