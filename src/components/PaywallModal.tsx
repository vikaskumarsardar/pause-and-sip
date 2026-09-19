import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  X,
  Wind,
  Headphones,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';

import { PAYWALL_PLAN, PACKAGE_ID, PaywallPlan } from '@/types';
import { COLORS, SPACING, RADIUS, HARDWARE } from '@/theme';
import { HapticService } from '@/services/haptics';
import { PurchaseService } from '@/services/purchases';

const TIMINGS = {
  AUTO_CLOSE_DELAY_MS: 1000,
} as const;

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>(PAYWALL_PLAN.LIFETIME);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PaywallPlan): Promise<void> => {
    await HapticService.selection();
    setSelectedPlan(plan);
  };

  const handlePurchaseCTA = async (): Promise<void> => {
    await HapticService.mediumTouch();
    setIsLoading(true);
    setStatusMessage(null);

    const isLifetimeSelected = selectedPlan === PAYWALL_PLAN.LIFETIME;
    const packageId = isLifetimeSelected ? PACKAGE_ID.LIFETIME_PRO : PACKAGE_ID.MONTHLY_PRO;
    const isPurchaseSuccessful = await PurchaseService.purchaseProPackage(packageId);

    setIsLoading(false);
    if (isPurchaseSuccessful) {
      await HapticService.success();
      setStatusMessage('Welcome to Pause & Sip Pro!');
      onSuccess();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, TIMINGS.AUTO_CLOSE_DELAY_MS);
    } else {
      await HapticService.warning();
      setStatusMessage('Purchase canceled or unavailable in dev mode.');
    }
  };

  const handleRestore = async (): Promise<void> => {
    await HapticService.lightTouch();
    setIsLoading(true);
    const isRestored = await PurchaseService.restorePurchases();
    setIsLoading(false);

    if (isRestored) {
      await HapticService.success();
      setStatusMessage('Purchases restored successfully!');
      onSuccess();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, TIMINGS.AUTO_CLOSE_DELAY_MS);
    } else {
      await HapticService.warning();
      setStatusMessage('No previous purchases found.');
    }
  };

  const handleToggleDevBypass = async (): Promise<void> => {
    await HapticService.heavyTouch();
    const currentBypassState = PurchaseService.getDevSandboxBypass();
    const nextBypassState = !currentBypassState;
    PurchaseService.setDevSandboxBypass(nextBypassState);

    const feedbackText = nextBypassState
      ? 'Dev Sandbox Bypass: Pro Unlocked'
      : 'Dev Sandbox Bypass: Disabled';
    setStatusMessage(feedbackText);

    if (nextBypassState) {
      onSuccess();
    }
  };

  const isBypassActive = PurchaseService.getDevSandboxBypass();
  const isLifetimeSelected = selectedPlan === PAYWALL_PLAN.LIFETIME;
  const isMonthlySelected = selectedPlan === PAYWALL_PLAN.MONTHLY;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <View style={styles.proBadgeRow}>
                <Sparkles size={16} color={COLORS.gold} />
                <Text style={styles.proBadgeText}>PRO COMPANION</Text>
              </View>
              <Text style={styles.headerTitle}>Elevate Your Desk Routine</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityLabel="Close Paywall Modal"
            >
              <X size={20} color={COLORS.body} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Pro Features Highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: `${COLORS.inhale}1A` }]}>
                  <Wind size={20} color={COLORS.inhale} />
                </View>
                <View style={styles.featureTextGroup}>
                  <Text style={styles.featureTitle}>Advanced Breath Pacing</Text>
                  <Text style={styles.featureSubtitle}>
                    4-7-8 Deep Sleep, 5-5 Coherence & custom rhythm controls.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: `${COLORS.water}1A` }]}>
                  <Headphones size={20} color={COLORS.water} />
                </View>
                <View style={styles.featureTextGroup}>
                  <Text style={styles.featureTitle}>Ambient Focus Soundscapes</Text>
                  <Text style={styles.featureSubtitle}>
                    Rain, ocean tide & binaural desk focus audio tracks.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: `${COLORS.gold}1A` }]}>
                  <Sparkles size={20} color={COLORS.gold} />
                </View>
                <View style={styles.featureTextGroup}>
                  <Text style={styles.featureTitle}>OLED Dark & Custom Themes</Text>
                  <Text style={styles.featureSubtitle}>
                    Deep slate, midnight velvet & minimalist aesthetic modes.
                  </Text>
                </View>
              </View>
            </View>

            {/* Offering Cards Selection */}
            <Text style={styles.sectionHeader}>SELECT YOUR PLAN</Text>
            <View style={styles.plansContainer}>
              {/* Lifetime Plan (Best Value) */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  isLifetimeSelected && styles.planCardActive,
                ]}
                onPress={() => handleSelectPlan(PAYWALL_PLAN.LIFETIME)}
                activeOpacity={0.85}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>

                <View style={styles.planCardContent}>
                  <View style={styles.planRadioRow}>
                    <CheckCircle2
                      size={20}
                      color={isLifetimeSelected ? COLORS.gold : COLORS.muted}
                    />
                    <View>
                      <Text style={styles.planTitle}>Lifetime Access</Text>
                      <Text style={styles.planSubtitle}>Pay once, own forever</Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>$9.99</Text>
                </View>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  isMonthlySelected && styles.planCardActive,
                ]}
                onPress={() => handleSelectPlan(PAYWALL_PLAN.MONTHLY)}
                activeOpacity={0.85}
              >
                <View style={styles.planCardContent}>
                  <View style={styles.planRadioRow}>
                    <CheckCircle2
                      size={20}
                      color={isMonthlySelected ? COLORS.water : COLORS.muted}
                    />
                    <View>
                      <Text style={styles.planTitle}>Monthly Plan</Text>
                      <Text style={styles.planSubtitle}>7-day trial, cancel anytime</Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>$1.99/mo</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Status Message */}
            {statusMessage && (
              <View style={styles.statusBanner}>
                <ShieldCheck size={16} color={COLORS.water} />
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            )}

            {/* Main Action CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, isLoading && styles.loadingState]}
              onPress={handlePurchaseCTA}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Zap size={20} color="#000000" />
              <Text style={styles.ctaButtonText}>
                {isLoading
                  ? 'Processing...'
                  : isMonthlySelected
                  ? 'Start 7-Day Free Trial'
                  : 'Unlock Lifetime Access'}
              </Text>
            </TouchableOpacity>

            {/* Secondary Buttons */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={styles.secondaryLinkButton}
                onPress={handleRestore}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryLinkText}>Restore Purchases</Text>
              </TouchableOpacity>

              <Text style={styles.actionDivider}>•</Text>

              <TouchableOpacity
                style={styles.secondaryLinkButton}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryLinkText}>Terms & Privacy</Text>
              </TouchableOpacity>
            </View>

            {/* Sandbox Dev Toggle */}
            <TouchableOpacity
              style={styles.devBypassButton}
              onPress={handleToggleDevBypass}
              activeOpacity={0.8}
            >
              <Text style={styles.devBypassText}>
                {isBypassActive ? '🟢 Dev Sandbox Active (Pro Enabled)' : '⚪ Dev Sandbox Toggle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextGroup: {
    gap: 4,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.title,
  },
  closeButton: {
    width: HARDWARE.minTouchTarget,
    height: HARDWARE.minTouchTarget,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  featuresContainer: {
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextGroup: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.title,
  },
  featureSubtitle: {
    fontSize: 13,
    color: COLORS.body,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginTop: SPACING.xs,
  },
  plansContainer: {
    gap: SPACING.sm,
  },
  planCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    position: 'relative',
  },
  planCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.surfaceElevated,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.title,
  },
  planSubtitle: {
    fontSize: 12,
    color: COLORS.body,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.title,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.water}1F`,
    borderWidth: 1,
    borderColor: COLORS.water,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.water,
  },
  ctaButton: {
    minHeight: HARDWARE.minTouchTarget,
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  loadingState: {
    opacity: 0.7,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  secondaryLinkButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  secondaryLinkText: {
    fontSize: 13,
    color: COLORS.body,
  },
  actionDivider: {
    color: COLORS.muted,
  },
  devBypassButton: {
    minHeight: HARDWARE.minTouchTarget,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  devBypassText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.body,
  },
});
