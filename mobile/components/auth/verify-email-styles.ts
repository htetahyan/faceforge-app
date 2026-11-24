import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 24,
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E1306C',
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 26,
    color: Theme.text,
    fontFamily: Theme.typography.bold,
  },
  brandSub: {
    color: Theme.textMuted,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
    fontFamily: Theme.typography.regular,
  },
  emailHighlight: {
    color: '#E1306C',
    fontFamily: Theme.typography.bold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
    fontFamily: Theme.typography.semibold,
  },
  card: {
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    ...Theme.shadow,
  },
  cardTitle: {
    fontSize: 16,
    color: Theme.text,
    marginBottom: 16,
    fontFamily: Theme.typography.bold,
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontFamily: Theme.typography.bold,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  countdownText: {
    color: Theme.textMuted,
    fontSize: 13,
    fontFamily: Theme.typography.regular,
  },
  countdownNumber: {
    color: Theme.primary,
    fontFamily: Theme.typography.bold,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: 'rgba(230, 0, 35, 0.02)',
  },
  resendText: {
    color: '#E1306C',
    fontSize: 13,
    fontFamily: Theme.typography.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 10,
  },
  logoutText: {
    color: Theme.textMuted,
    fontSize: 14,
    fontFamily: Theme.typography.semibold,
  },
});
