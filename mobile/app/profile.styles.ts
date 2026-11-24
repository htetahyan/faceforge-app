import { StyleSheet } from 'react-native';
import { Theme, Fonts } from '../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7', // Pinterest style base background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#111111',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  form: { 
    padding: 20, 
    gap: 24 
  },
  profileHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16,
    paddingBottom: 4 
  },
  profileInfo: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(230, 0, 35, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: Theme.primary, 
    fontSize: 24, 
    fontFamily: Fonts.bold 
  },
  name: { 
    fontSize: 20, 
    fontFamily: Fonts.bold, 
    color: Theme.text 
  },
  email: { 
    fontSize: 14, 
    fontFamily: Fonts.regular, 
    color: Theme.textMuted,
    marginTop: 2
  },
  tierBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFEFEF',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tierHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  tierLabel: { 
    fontSize: 15, 
    color: Theme.text, 
    fontFamily: Fonts.bold 
  },
  tierName: { 
    color: Theme.primary, 
    fontFamily: Fonts.bold 
  },
  usageText: { 
    color: Theme.textMuted, 
    fontFamily: Fonts.medium, 
    fontSize: 14 
  },
  upgradeBtn: { 
    backgroundColor: Theme.primary, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8,
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeBtnText: { 
    color: Theme.surface, 
    fontFamily: Fonts.bold, 
    fontSize: 14 
  },
  manageBtn: { 
    backgroundColor: '#F3F4F6', 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8 
  },
  manageBtnText: { 
    color: Theme.text, 
    fontFamily: Fonts.bold, 
    fontSize: 14 
  },
  actionsContainer: {
    gap: 12,
  },
  logoutBtn: { 
    backgroundColor: '#FFFFFF',
    height: 52, 
    borderColor: '#EFEFEF', 
    borderWidth: 1, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoutText: { 
    color: Theme.text, 
    fontFamily: Fonts.semibold, 
    fontSize: 15 
  },
  deleteBtn: { 
    backgroundColor: '#FFFFFF',
    height: 52, 
    borderColor: 'rgba(239, 68, 68, 0.15)', 
    borderWidth: 1, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  deleteText: { 
    color: '#EF4444', 
    fontFamily: Fonts.semibold, 
    fontSize: 15 
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    justifyContent: 'center',
    marginTop: 20,
  },
  securityText: { 
    color: Theme.textMuted, 
    fontFamily: Fonts.regular, 
    fontSize: 11 
  },
  
  // Skeleton styles
  skeletonTextShort: {
    height: 14,
    backgroundColor: '#EFEFEF',
    borderRadius: 4,
    width: '40%',
    marginVertical: 4,
  },
  skeletonTextLong: {
    height: 16,
    backgroundColor: '#EFEFEF',
    borderRadius: 4,
    width: '70%',
    marginVertical: 4,
  },
  skeletonButton: {
    height: 48,
    backgroundColor: '#EFEFEF',
    borderRadius: 24,
    width: '100%',
    marginTop: 8,
  },
  cancelStatusContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  cancelStatusText: {
    color: '#EF4444',
    fontFamily: Fonts.bold,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cancelBtnNative: {
    backgroundColor: '#FFF5F5',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnNativeText: {
    color: '#EF4444',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});

export default styles;
