import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from '../services/secureStore';
import { authApi } from '../services/authService';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  subscriptionTier?: string;
  role?: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleWeb?: (idToken: string, email?: string, name?: string) => Promise<void>;
  loginWithApple: () => Promise<void>;
  verifyEmail: (otp: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dynamically load native Google and Apple modules to prevent crashes on Expo Go
let GoogleSignin: any = null;
let statusCodes: any = null;
let AppleAuthentication: any = null;

try {
  const googleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleModule.GoogleSignin;
  statusCodes = googleModule.statusCodes;
} catch (e) {
  console.log('[Auth] GoogleSignin native module is not registered in this binary (running in Expo Go)');
}

try {
  AppleAuthentication = require('expo-apple-authentication');
} catch (e) {
  console.log('[Auth] AppleAuthentication native module is not registered in this binary');
}

import Purchases from 'react-native-purchases';

const identifyRevenueCatUser = async (userId: string) => {
  if (Platform.OS !== 'web') {
    try {
      await Purchases.logIn(userId);
    } catch (e) {
      // Safe fallback if native module is unlinked or in Expo Go
    }
  }
};

const resetRevenueCatUser = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Purchases.logOut();
    } catch (e) {
      // Safe fallback
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and configure Google Sign-In on mount
  useEffect(() => {
    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
        });
      } catch (err) {
        console.warn('[Auth] Failed to configure Google Sign-In:', err);
      }
    }
  }, []);

  // Check if token exists in SecureStore on startup and verify it
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('user_session_token');
        if (storedToken) {
          setToken(storedToken);
          const response = await authApi.getCurrentUser(storedToken);
          setUser(response.data.user);
          if (response.data.user?.id) {
            await identifyRevenueCatUser(response.data.user.id);
          }
        }
      } catch (err) {
        console.log('[Auth] Token verification failed or expired. Resetting session...');
        await SecureStore.deleteItemAsync('user_session_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Standard Email/Password Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      const { user: userProfile, token: jwtToken } = response.data;

      await SecureStore.setItemAsync('user_session_token', jwtToken);
      setToken(jwtToken);
      setUser(userProfile);
      if (userProfile?.id) {
        await identifyRevenueCatUser(userProfile.id);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Login failed';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Email/Password Register
  const register = async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(email, password, displayName);
      const { user: userProfile, token: jwtToken } = response.data;

      await SecureStore.setItemAsync('user_session_token', jwtToken);
      setToken(jwtToken);
      setUser(userProfile);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Registration failed';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Real Google Sign-In Flow
  const loginWithGoogle = async () => {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In is supported on native development builds.');
    }
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Clear previous cached session to force native Google Account Picker UI modal to popup
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if no user was previously signed in
      }

      const result = await GoogleSignin.signIn();

      const idToken = result.data?.idToken || (result as any).idToken;
      const email = result.data?.user?.email || (result as any).user?.email;
      const name = result.data?.user?.name || (result as any).user?.name;

      if (!idToken) {
        console.log('[Auth] Google Sign-In modal was closed or cancelled by user.');
        return;
      }

      const response = await authApi.oauth('google', idToken, email, name);

      const { user: userProfile, token: jwtToken } = response.data;
      await SecureStore.setItemAsync('user_session_token', jwtToken);
      setToken(jwtToken);
      setUser(userProfile);
      if (userProfile?.id) {
        await identifyRevenueCatUser(userProfile.id);
      }
    } catch (err: any) {
      if (statusCodes && err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Auth] Google Sign-In cancelled by user.');
        return;
      }
      if (err.message?.includes('cancelled') || err.message?.includes('no ID token')) {
        console.log('[Auth] Google Sign-In process cancelled.');
        return;
      }
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        const msg = 'Backend server unreachable. Please check backend connection at port 3005.';
        console.warn('[Auth] Network Error:', msg);
        throw new Error(msg);
      }
      
      const backendError = err.response?.data?.error || err.response?.data?.details;
      console.warn('[Auth] Google Login Error:', backendError || err.message || err);
      
      throw new Error(backendError || err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Real Apple Sign-In Flow
  const loginWithApple = async () => {
    if (!AppleAuthentication) {
      throw new Error('Apple Authentication is only supported on native iOS development builds. In Expo Go, please register/login using email and password.');
    }
    try {
      setIsLoading(true);
      
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Authentication is only supported on iOS devices.');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple authentication returned no identity token.');
      }

      const response = await authApi.oauth(
        'apple',
        credential.identityToken,
        credential.email || undefined,
        credential.fullName?.givenName 
          ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim() 
          : undefined
      );

      const { user: userProfile, token: jwtToken } = response.data;
      await SecureStore.setItemAsync('user_session_token', jwtToken);
      setToken(jwtToken);
      setUser(userProfile);
    } catch (err: any) {
      console.error('[Auth] Apple Login Error:', err);
      throw new Error(err.message || 'Apple Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Email OTP
  const verifyEmail = async (otp: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.verifyEmail(otp);
      const { user: userProfile } = response.data;
      setUser(userProfile);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Verification failed';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Verification OTP
  const resendVerification = async () => {
    try {
      setIsLoading(true);
      await authApi.resendVerification();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to resend code';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Log Out
  const logout = async () => {
    try {
      setIsLoading(true);
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          // Ignore if already signed out
        }
      }
      await SecureStore.deleteItemAsync('user_session_token');
      await SecureStore.deleteItemAsync('has_completed_onboarding');
      await resetRevenueCatUser();
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('[Auth] Error deleting session token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        verifyEmail,
        resendVerification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
