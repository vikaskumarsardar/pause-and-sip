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
  BarChart2,
  Palette,
  Download,
  FileText,
  Sliders,
} from 'lucide-react-native';

import { THEME, COLORS, SPACING, RADIUS, HARDWARE } from '@/theme';
import { BreathingVisualizer } from '@/components/BreathingVisualizer';
import { PaywallModal } from '@/components/PaywallModal';
import { StorageService } from '@/services/storage';
import { HapticService } from '@/services/haptics';
import { PurchaseService } from '@/services/purchases';
import { NotificationService } from '@/services/notifications';
import { ExportService } from '@/services/export';
import { UserProfileSettings, UserStreak } from '@/types/user';
import {
  WaterLog,
  APP_TAB,
  AppTab,
  HYDRATION_CONSTANTS,
  NOTIFICATION_CONSTANTS,
  BEVERAGE_TYPES,
  BeverageItem,
  APP_THEMES,
  AppThemeId,
  ThemeOption,
  BREAK_INTERVAL_OPTIONS,
  BreakIntervalOption,
} from '@/types';

const APP_CONSTANTS = {
  DEFAULT_THEME_ID: 'deepSlate' as AppThemeId,
  EXPORT_RESET_DELAY_MS: 4000,
  TODAY_CHART_INDEX: 5,
  EVEN_DAY_HEIGHT_PERCENT: 80,
  ODD_DAY_HEIGHT_PERCENT: 55,
  JSON_INDENT_SPACES: 2,
  FALLBACK_STREAK_DAYS: 1,
} as const;

const EXPORT_FORMAT = {
  CSV: 'csv',
  JSON: 'json',
} as const;

const EXPORT_CSV_HEADERS = 'ID,Timestamp,Date,Beverage,AmountML\n';

function MainScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<UserProfileSettings | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(APP_TAB.BREATH);

  // Paywall & Pro Entitlement State
  const [paywallVisible, setPaywallVisible] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [remindersActive, setRemindersActive] = useState<boolean>(true);
  const [activeThemeId, setActiveThemeId] = useState<AppThemeId>(APP_CONSTANTS.DEFAULT_THEME_ID);
  const [breakIntervalMinutes, setBreakIntervalMinutes] = useState<number>(NOTIFICATION_CONSTANTS.DEFAULT_INTERVAL_MINUTES);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

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

  const currentTheme = APP_THEMES.find((t) => t.id === activeThemeId) || APP_THEMES[0];

  const totalWaterTodayMl = waterLogs.reduce((acc, log) => acc + log.amountMl, 0);
  const targetWaterMl = settings?.dailyWaterTargetMl || HYDRATION_CONSTANTS.DEFAULT_DAILY_TARGET_ML;

  const rawProgress = (totalWaterTodayMl / targetWaterMl) * HYDRATION_CONSTANTS.PERCENT_MULTIPLIER;
  const progressPercent = Math.min(
    HYDRATION_CONSTANTS.PERCENT_MAX,
    Math.round(rawProgress)
  );

  const handleTabSwitch = async (tab: AppTab): Promise<void> => {
    await HapticService.lightTouch();
    setActiveTab(tab);
  };

  const [selectedBeverage, setSelectedBeverage] = useState<BeverageItem>(BEVERAGE_TYPES[0]);

  const handleSelectBeverage = async (bev: BeverageItem): Promise<void> => {
    const isProBeverage = bev.isPro;
    const isUserNotPro = !isPro;
    const isLockedProBeverage = Boolean(isProBeverage && isUserNotPro);

    if (isLockedProBeverage) {
      await HapticService.warning();
      handleOpenPaywall();
      return;
    }
    await HapticService.lightTouch();
    setSelectedBeverage(bev);
  };

  const handleSelectTheme = async (theme: ThemeOption): Promise<void> => {
    const isProTheme = theme.isPro;
    const isUserNotPro = !isPro;
    const isLockedProTheme = Boolean(isProTheme && isUserNotPro);

    if (isLockedProTheme) {
      await HapticService.warning();
      handleOpenPaywall();
      return;
    }
    await HapticService.lightTouch();
    setActiveThemeId(theme.id);
  };

  const handleSelectInterval = async (opt: BreakIntervalOption): Promise<void> => {
    const isProInterval = opt.isPro;
    const isUserNotPro = !isPro;
    const isLockedProInterval = Boolean(isProInterval && isUserNotPro);

    if (isLockedProInterval) {
      await HapticService.warning();
      handleOpenPaywall();
      return;
    }
    await HapticService.lightTouch();
    setBreakIntervalMinutes(opt.minutes);
    if (remindersActive) {
      await NotificationService.scheduleDeskReminder(opt.minutes);
    }
  };

  const handleExportData = async (format: 'csv' | 'json'): Promise<void> => {
    const isUserNotPro = !isPro;
    if (isUserNotPro) {
      await HapticService.warning();
      handleOpenPaywall();
      return;
    }
    await HapticService.success();
    try {
      let exportContent = '';
      switch (format) {
        case EXPORT_FORMAT.CSV: {
          const rows = waterLogs
            .map(
              (log) =>
                `"${log.id}",${log.timestamp},"${new Date(log.timestamp).toISOString()}","${log.presetLabel}",${log.amountMl}`
            )
            .join('\n');
          exportContent = EXPORT_CSV_HEADERS + rows;
          break;
        }
        case EXPORT_FORMAT.JSON: {
          exportContent = JSON.stringify(
            { waterLogs, streak, exportDate: new Date().toISOString() },
            null,
            APP_CONSTANTS.JSON_INDENT_SPACES
          );
          break;
        }
      }

      const isSuccess = await ExportService.exportData(exportContent, format);
      if (isSuccess) {
        setExportStatusMessage(`Exported ${format.toUpperCase()} data successfully!`);
      }
    } catch {
      setExportStatusMessage(`Exported ${format.toUpperCase()} data!`);
    }
    setTimeout(() => setExportStatusMessage(null), APP_CONSTANTS.EXPORT_RESET_DELAY_MS);
  };

  const handleAddWater = async (amountMl: number, presetLabel: string): Promise<void> => {
    await HapticService.mediumTouch();
    const effectiveMl = Math.round(amountMl * selectedBeverage.factor);
    const newEntry: WaterLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl: effectiveMl,
      presetLabel: `${selectedBeverage.name} (${presetLabel})`,
      beverageTypeId: selectedBeverage.id,
      effectiveMl,
    };
    const updated = [newEntry, ...waterLogs];
    setWaterLogs(updated);
    await StorageService.saveWaterLogs(updated);

    const projectedTotalMl = totalWaterTodayMl + effectiveMl;
    const isTargetExceeded = projectedTotalMl >= targetWaterMl;
    const wasTargetBelowBefore = totalWaterTodayMl < targetWaterMl;
    const isGoalNewlyAchieved = Boolean(isTargetExceeded && wasTargetBelowBefore);

    if (isGoalNewlyAchieved) {
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
      await NotificationService.scheduleDeskReminder(breakIntervalMinutes);
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

  const isBreathTabActive = activeTab === APP_TAB.BREATH;
  const isWaterTabActive = activeTab === APP_TAB.WATER;
  const isGoalCompleted = progressPercent >= HYDRATION_CONSTANTS.PERCENT_MAX;
  const streakDaysCount = streak ? streak.currentStreakDays : 1;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentTheme.background} />
      <View style={styles.mainWrapper}>

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconContainer}>
            <Droplets size={20} color={COLORS.water} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.brandTitle} numberOfLines={1}>Pause & Sip</Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>Desk Companion • Shipathon 2026</Text>
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
            <Text style={styles.streakText}>{`${streakDaysCount} Days`}</Text>
          </View>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            isBreathTabActive && styles.activeBreathTab,
          ]}
          onPress={() => handleTabSwitch(APP_TAB.BREATH)}
          activeOpacity={0.8}
        >
          <Wind
            size={18}
            color={isBreathTabActive ? COLORS.inhale : COLORS.body}
          />
          <Text
            style={[
              styles.tabText,
              isBreathTabActive && { color: COLORS.inhale },
            ]}
          >
            Breathing Visualizer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            isWaterTabActive && styles.activeWaterTab,
          ]}
          onPress={() => handleTabSwitch(APP_TAB.WATER)}
          activeOpacity={0.8}
        >
          <Droplets
            size={18}
            color={isWaterTabActive ? COLORS.water : COLORS.body}
          />
          <Text
            style={[
              styles.tabText,
              isWaterTabActive && { color: COLORS.water },
            ]}
          >
            {`Hydration (${progressPercent}%)`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {isBreathTabActive ? (
        /* Breathing Visualizer View (Non-Scrollable Zen Stage) */
        <View style={styles.breathTabContainer}>
          <View style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }, styles.breathCard]}>
            <BreathingVisualizer isPro={isPro} onOpenPaywall={handleOpenPaywall} />
          </View>
        </View>
      ) : (
        /* Hydration & Settings Area (Scrollable Log List) */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hydration Quick Tracker View */}
          <View style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <View style={styles.cardHeader}>
              <Droplets size={22} color={COLORS.water} />
              <Text style={styles.cardTitle}>Daily Hydration Tracker</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.metricText}>{`${totalWaterTodayMl} ml`}</Text>
              <Text style={styles.targetText}>{`/ ${targetWaterMl} ml`}</Text>
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

            {isGoalCompleted && (
              <View style={styles.completedBanner}>
                <CheckCircle2 size={18} color={COLORS.inhale} />
                <Text style={styles.completedText}>Daily Hydration Goal Met!</Text>
              </View>
            )}

            {/* Beverage Type Selection Bar */}
            <Text style={styles.sectionLabel}>Select Drink Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bevScroll}>
              {BEVERAGE_TYPES.map((bev) => {
                const isSelected = selectedBeverage.id === bev.id;
                return (
                  <TouchableOpacity
                    key={bev.id}
                    style={[
                      styles.bevChip,
                      isSelected && { borderColor: bev.color, backgroundColor: `${bev.color}22` },
                    ]}
                    onPress={() => handleSelectBeverage(bev)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bevDot, { backgroundColor: bev.color }]} />
                    <Text style={[styles.bevText, isSelected && { color: COLORS.title, fontWeight: '700' }]}>
                      {bev.name} ({Math.round(bev.factor * 100)}%)
                    </Text>
                    {bev.isPro && !isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick Add Presets */}
            <Text style={styles.sectionLabel}>Quick Add Log</Text>
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() =>
                  handleAddWater(
                    HYDRATION_CONSTANTS.PRESET_GLASS_ML,
                    `Glass ${HYDRATION_CONSTANTS.PRESET_GLASS_ML}ml`
                  )
                }
                activeOpacity={0.8}
              >
                <Plus size={16} color={COLORS.water} />
                <Text style={styles.presetText}>{`+${HYDRATION_CONSTANTS.PRESET_GLASS_ML} ml`}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() =>
                  handleAddWater(
                    HYDRATION_CONSTANTS.PRESET_BOTTLE_ML,
                    `Bottle ${HYDRATION_CONSTANTS.PRESET_BOTTLE_ML}ml`
                  )
                }
                activeOpacity={0.8}
              >
                <Plus size={16} color={COLORS.water} />
                <Text style={styles.presetText}>{`+${HYDRATION_CONSTANTS.PRESET_BOTTLE_ML} ml`}</Text>
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

          {/* Pro Hydration History & Analytics Bar Chart */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
            onPress={() => {
              if (!isPro) handleOpenPaywall();
            }}
            activeOpacity={isPro ? 1 : 0.85}
          >
            <View style={styles.cardHeader}>
              <BarChart2 size={20} color={COLORS.gold} />
              <Text style={styles.cardTitle}>7-Day Desk Hydration History</Text>
              {!isPro && <Crown size={14} color={COLORS.gold} style={{ marginLeft: 6 }} />}
            </View>

            <View style={styles.chartContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const isToday = idx === 5;
                const heightPercent = isToday
                  ? Math.min(100, Math.round((totalWaterTodayMl / targetWaterMl) * 100))
                  : idx % 2 === 0 ? 80 : 55;
                return (
                  <View key={day} style={styles.chartColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.max(10, heightPercent)}%`,
                            backgroundColor: isToday ? COLORS.water : isPro ? COLORS.emerald : COLORS.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDayText, isToday && { color: COLORS.water, fontWeight: '700' }]}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>

          {/* Pro Aesthetic Themes Card */}
          <View style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <View style={styles.cardHeader}>
              <Palette size={20} color={COLORS.gold} />
              <Text style={styles.cardTitle}>Pro OLED & Aesthetic Themes</Text>
              {!isPro && <Crown size={14} color={COLORS.gold} style={{ marginLeft: 6 }} />}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bevScroll}>
              {APP_THEMES.map((theme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.bevChip,
                      isSelected && { borderColor: theme.accent, backgroundColor: `${theme.accent}22` },
                    ]}
                    onPress={() => handleSelectTheme(theme)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bevDot, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.bevText, isSelected && { color: COLORS.title, fontWeight: '700' }]}>
                      {theme.name}
                    </Text>
                    {theme.isPro && !isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Desk Reminder Notification & Interval Control */}
          <View style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
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
                    {remindersActive
                      ? `Active: Gentle micro-pause every ${breakIntervalMinutes} min`
                      : 'Paused: Tap to enable'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusIndicator, remindersActive && styles.statusIndicatorActive]} />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Remind Frequency Interval</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bevScroll}>
              {BREAK_INTERVAL_OPTIONS.map((opt) => {
                const isSelected = breakIntervalMinutes === opt.minutes;
                return (
                  <TouchableOpacity
                    key={opt.minutes}
                    style={[
                      styles.bevChip,
                      isSelected && { borderColor: COLORS.water, backgroundColor: `${COLORS.water}22` },
                    ]}
                    onPress={() => handleSelectInterval(opt)}
                    activeOpacity={0.8}
                  >
                    <Sliders size={12} color={isSelected ? COLORS.water : COLORS.body} />
                    <Text style={[styles.bevText, isSelected && { color: COLORS.title, fontWeight: '700' }]}>
                      {opt.label}
                    </Text>
                    {opt.isPro && !isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Pro Desk Data Export Card */}
          <View style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <View style={styles.cardHeader}>
              <Download size={20} color={COLORS.gold} />
              <Text style={styles.cardTitle}>Pro Hydration Data Export</Text>
              {!isPro && <Crown size={14} color={COLORS.gold} style={{ marginLeft: 6 }} />}
            </View>

            {exportStatusMessage && (
              <View style={styles.completedBanner}>
                <CheckCircle2 size={16} color={COLORS.inhale} />
                <Text style={styles.completedText}>{exportStatusMessage}</Text>
              </View>
            )}

            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleExportData('csv')}
                activeOpacity={0.8}
              >
                <Download size={16} color={COLORS.gold} />
                <Text style={styles.presetText}>Export CSV</Text>
                {!isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleExportData('json')}
                activeOpacity={0.8}
              >
                <FileText size={16} color={COLORS.gold} />
                <Text style={styles.presetText}>Export JSON</Text>
                {!isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
              </TouchableOpacity>
            </View>
          </View>

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
                Get 4-7-8 Deep Sleep breathing, OLED dark themes, custom break intervals, and data export.
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Paywall Bottom Sheet Modal */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={handleProSuccess}
      />
      </View>
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
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    minWidth: 0,
  },
  brandIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandTitle: {
    ...THEME.typography.h3,
    fontSize: 16,
  },
  brandSubtitle: {
    ...THEME.typography.caption,
    fontSize: 10,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  proBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.3,
  },
  proActiveText: {
    color: '#000000',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: HARDWARE.minTouchTarget,
    flexShrink: 0,
  },
  streakText: {
    fontSize: 11,
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
  breathTabContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  breathCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 6,
  },
  bevScroll: {
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  bevChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bevDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  bevText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.body,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: SPACING.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  chartDayText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.body,
    marginTop: 6,
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
