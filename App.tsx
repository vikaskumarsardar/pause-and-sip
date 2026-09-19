import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Droplets,
  Wind,
  Flame,
  Plus,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Bell,
  Crown,
} from 'lucide-react-native';

import { THEME, COLORS, SPACING, RADIUS, HARDWARE } from './src/theme';
import { BreathingVisualizer } from './src/components/BreathingVisualizer';
import { PaywallModal } from './src/components/PaywallModal';
import { StorageService } from './src/services/storage';
import { HapticService } from './src/services/haptics';
import { PurchaseService } from './src/services/purchases';
import { NotificationService } from './src/services/notifications';
import { UserProfileSettings, UserStreak } from './src/types/user';
import { WaterLog } from './src/types';

function MainScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<UserProfileSettings | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [activeTab, setActiveTab] = useState<'breath' | 'water'>('breath');

  // Paywall & Pro Entitlement State
  const [paywallVisible, setPaywallVisible] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [remindersActive, setRemindersActive] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData(): Promise<void> {
      // Initialize RevenueCat & OneSignal
      await PurchaseService.initPurchases();
      await NotificationService.initOneSignal();

      const userSettings = await StorageService.getUserSettings();
      const userStreak = await StorageService.getUserStreak();
      const storedWater = await StorageService.getWaterLogs();
      const proStatus = await PurchaseService.checkProEntitlement();

      if (isMounted) {
        setSettings(userSettings);
        setStreak(userStreak);
        setIsPro(proStatus);
        setWaterLogs(
          storedWater.map((item) => ({
            id: item.id,
            timestamp: item.timestamp,
            amountMl: item.amountMl,
            presetLabel: item.presetLabel,
          }))
        );
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalWaterTodayMl = waterLogs.reduce((acc, log) => acc + log.amountMl, 0);
  const targetWaterMl = settings?.dailyWaterTargetMl || 2500;
  const progressPercent = Math.min(100, Math.round((totalWaterTodayMl / targetWaterMl) * 100));

  const handleTabSwitch = async (tab: 'breath' | 'water'): Promise<void> => {
    await HapticService.lightTouch();
    setActiveTab(tab);
  };

  const handleAddWater = async (amountMl: number, presetLabel: string): Promise<void> => {
    await HapticService.mediumTouch();
    const newEntry: WaterLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl,
      presetLabel,
    };
    const updated = [newEntry, ...waterLogs];
    setWaterLogs(updated);
    await StorageService.saveWaterLogs(updated);

    if (totalWaterTodayMl + amountMl >= targetWaterMl && totalWaterTodayMl < targetWaterMl) {
      await HapticService.success();
    }
  };

  const handleResetWater = async (): Promise<void> => {
    await HapticService.warning();
    setWaterLogs([]);
    await StorageService.saveWaterLogs([]);
  };

  const handleToggleReminders = async (): Promise<void> => {
    await HapticService.mediumTouch();
    const nextState = !remindersActive;
    setRemindersActive(nextState);
    if (nextState) {
      await NotificationService.scheduleDeskReminder(45);
    } else {
      await NotificationService.disableDeskReminders();
    }
  };

  const handleOpenPaywall = async (): Promise<void> => {
    await HapticService.mediumTouch();
    setPaywallVisible(true);
  };

  const handleProSuccess = async (): Promise<void> => {
    const status = await PurchaseService.checkProEntitlement();
    setIsPro(status);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconContainer}>
            <Droplets size={20} color={COLORS.water} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Pause & Sip</Text>
            <Text style={styles.brandSubtitle}>Desk Companion • Shipathon 2026</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Pro Entitlement Status / Upgrade Button */}
          <TouchableOpacity
            style={[styles.proBadgeButton, isPro && styles.proActiveBadge]}
            onPress={handleOpenPaywall}
            activeOpacity={0.8}
          >
            <Crown size={14} color={isPro ? '#000000' : COLORS.gold} />
            <Text style={[styles.proBadgeText, isPro && styles.proActiveText]}>
              {isPro ? 'PRO UNLOCKED' : 'GET PRO'}
            </Text>
          </TouchableOpacity>

          {/* Streak Badge */}
          <View style={styles.streakBadge}>
            <Flame size={16} color={COLORS.hold} />
            <Text style={styles.streakText}>
              {streak ? `${streak.currentStreakDays} Days` : '1 Day'}
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'breath' && styles.activeBreathTab,
          ]}
          onPress={() => handleTabSwitch('breath')}
          activeOpacity={0.8}
        >
          <Wind
            size={18}
            color={activeTab === 'breath' ? COLORS.inhale : COLORS.body}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'breath' && { color: COLORS.inhale },
            ]}
          >
            Breathing Visualizer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'water' && styles.activeWaterTab,
          ]}
          onPress={() => handleTabSwitch('water')}
          activeOpacity={0.8}
        >
          <Droplets
            size={18}
            color={activeTab === 'water' ? COLORS.water : COLORS.body}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'water' && { color: COLORS.water },
            ]}
          >
            Hydration ({progressPercent}%)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'breath' ? (
          /* Breathing Visualizer View */
          <View style={styles.card}>
            <BreathingVisualizer
              inhaleSec={4}
              holdInSec={4}
              exhaleSec={4}
              holdOutSec={4}
            />
          </View>
        ) : (
          /* Hydration Quick Tracker View */
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Droplets size={22} color={COLORS.water} />
              <Text style={styles.cardTitle}>Daily Hydration Tracker</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.metricText}>{totalWaterTodayMl} ml</Text>
              <Text style={styles.targetText}>/ {targetWaterMl} ml</Text>
            </View>

            {/* Progress Bar Container */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>

            {progressPercent >= 100 && (
              <View style={styles.completedBanner}>
                <CheckCircle2 size={18} color={COLORS.inhale} />
                <Text style={styles.completedText}>Daily Hydration Goal Met!</Text>
              </View>
            )}

            {/* Quick Add Presets */}
            <Text style={styles.sectionLabel}>Quick Add Log</Text>
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleAddWater(250, 'Glass (250ml)')}
                activeOpacity={0.8}
              >
                <Plus size={16} color={COLORS.water} />
                <Text style={styles.presetText}>+250 ml</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleAddWater(500, 'Bottle (500ml)')}
                activeOpacity={0.8}
              >
                <Plus size={16} color={COLORS.water} />
                <Text style={styles.presetText}>+500 ml</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetWater}
                activeOpacity={0.8}
              >
                <RotateCcw size={16} color={COLORS.body} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Desk Reminder Notification Control */}
        <TouchableOpacity
          style={styles.reminderBanner}
          onPress={handleToggleReminders}
          activeOpacity={0.85}
        >
          <View style={styles.reminderLeftGroup}>
            <View style={styles.bellIconBox}>
              <Bell size={18} color={remindersActive ? COLORS.water : COLORS.muted} />
            </View>
            <View>
              <Text style={styles.reminderTitle}>OneSignal Desk Break Push</Text>
              <Text style={styles.reminderSubtitle}>
                {remindersActive ? 'Active: Gentle micro-pause every 45 min' : 'Paused: Tap to enable'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusIndicator, remindersActive && styles.statusIndicatorActive]} />
        </TouchableOpacity>

        {/* Upgrade Callout Card (if not Pro) */}
        {!isPro && (
          <TouchableOpacity
            style={styles.proBannerCard}
            onPress={handleOpenPaywall}
            activeOpacity={0.85}
          >
            <View style={styles.proBannerHeader}>
              <Sparkles size={20} color={COLORS.gold} />
              <Text style={styles.proBannerTitle}>Unlock Pause & Sip Pro</Text>
            </View>
            <Text style={styles.proBannerBody}>
              Get 4-7-8 Deep Sleep breathing, binaural ocean soundscapes, and OLED dark themes.
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Paywall Bottom Sheet Modal */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={handleProSuccess}
      />
    </View>
  );
}

export default function App(): React.ReactElement {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <MainScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...THEME.typography.h3,
  },
  brandSubtitle: {
    ...THEME.typography.caption,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  proBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.gold,
    minHeight: HARDWARE.minTouchTarget,
  },
  proActiveBadge: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  proActiveText: {
    color: '#000000',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: HARDWARE.minTouchTarget,
  },
  streakText: {
    ...THEME.typography.caption,
    color: COLORS.title,
    fontWeight: '600',
  },
  tabBarContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  tabButton: {
    flex: 1,
    minHeight: HARDWARE.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  activeBreathTab: {
    borderColor: COLORS.inhale,
    backgroundColor: COLORS.surfaceElevated,
  },
  activeWaterTab: {
    borderColor: COLORS.water,
    backgroundColor: COLORS.surfaceElevated,
  },
  tabText: {
    ...THEME.typography.bodyMedium,
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    ...THEME.typography.h3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  metricText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.title,
  },
  targetText: {
    fontSize: 16,
    color: COLORS.body,
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.water,
    borderRadius: RADIUS.full,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.inhale}1F`,
    borderWidth: 1,
    borderColor: COLORS.inhale,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inhale,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  presetButton: {
    flex: 1,
    minHeight: HARDWARE.minTouchTarget,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.title,
  },
  resetButton: {
    width: HARDWARE.minTouchTarget,
    height: HARDWARE.minTouchTarget,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: HARDWARE.minTouchTarget,
  },
  reminderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  bellIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.title,
  },
  reminderSubtitle: {
    fontSize: 12,
    color: COLORS.body,
    marginTop: 2,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.muted,
  },
  statusIndicatorActive: {
    backgroundColor: COLORS.inhale,
  },
  proBannerCard: {
    backgroundColor: `${COLORS.gold}14`,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  proBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  proBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
  },
  proBannerBody: {
    fontSize: 13,
    color: COLORS.title,
    lineHeight: 18,
  },
});
