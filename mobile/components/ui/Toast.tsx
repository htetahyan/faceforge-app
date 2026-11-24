import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, Fonts } from '../../constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string, toastType: ToastType = 'success') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3200);
  }, [slideAnim]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={18} color="#10B981" />;
      case 'error':
        return <Ionicons name="alert-circle" size={18} color="#EF4444" />;
      default:
        return <Ionicons name="information-circle" size={18} color={Theme.primary} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'error':
        return 'rgba(239, 68, 68, 0.4)';
      default:
        return Theme.glass.border;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: slideAnim }],
              top: Platform.OS === 'ios' ? insets.top + 10 : 20,
              borderColor: getBorderColor(),
            },
          ]}
        >
          <View style={styles.iconWrapper}>{getIcon()}</View>
          <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Theme.glass.background,
    borderWidth: 1.5,
    borderRadius: 18,
    ...Theme.glass.shadow,
  },
  iconWrapper: {
    marginRight: 10,
  },
  toastText: {
    color: Theme.text,
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
    flex: 1,
  },
});
