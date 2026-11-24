import { Platform } from 'react-native';

const tintColorLight = '#E60023';
const tintColorDark = '#E60023';

export const Theme = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F5F5',
  primary: '#E60023',
  primaryDark: '#BD081C',
  secondary: '#E60023',
  accent: '#767676',
  text: '#111111',
  textMuted: '#767676',
  textLight: '#FFFFFF',
  error: '#E60023',
  success: '#0FA573',
  border: '#EFEFEF',
  borderStrong: '#E1E1E1',
  shadow: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  typography: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
  },
  space: {
    xs: 4,
    sm: 8,
    base: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    xs: 4,
    sm: 8,
    base: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.95)',
    overlay: 'rgba(0, 0, 0, 0.45)',
    border: '#EFEFEF',
    shadow: {
      shadowColor: '#111111',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export const Colors = {
  light: {
    text: Theme.text,
    background: Theme.background,
    tint: tintColorLight,
    icon: Theme.textMuted,
    tabIconDefault: Theme.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Theme.text,
    background: Theme.background,
    tint: tintColorDark,
    icon: Theme.textMuted,
    tabIconDefault: Theme.textMuted,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = {
  regular: Theme.typography.regular,
  medium: Theme.typography.medium,
  semibold: Theme.typography.semibold,
  bold: Theme.typography.bold,
};
