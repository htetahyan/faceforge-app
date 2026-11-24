import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Checks if the native ExpoSecureStore module is available.
 * If running on Web or a platform without native link, fallback to localStorage.
 */
const checkAvailability = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  const isAvailable = await checkAvailability();
  if (isAvailable) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('[SecureStore] getItemAsync error, falling back:', err);
    }
  }
  
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  const isAvailable = await checkAvailability();
  if (isAvailable) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (err) {
      console.warn('[SecureStore] setItemAsync error, falling back:', err);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  const isAvailable = await checkAvailability();
  if (isAvailable) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch (err) {
      console.warn('[SecureStore] deleteItemAsync error, falling back:', err);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
  }
};
