import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Play, Pause, RefreshCw, Wind } from 'lucide-react-native';

import { BreathPhase, BREATH_PHASE, BREATHING_CONSTANTS } from '@/types';
import { COLORS, SPACING, RADIUS, HARDWARE } from '@/theme';
import { HapticService } from '@/services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LAYOUT_DIMENSIONS = {
  SCREEN_PADDING: 64,
  MAX_CONTAINER_SIZE: 300,
  INNER_ORB_SIZE: 140,
  MS_PER_SECOND: 1000,
} as const;

const CONTAINER_SIZE = Math.min(
  SCREEN_WIDTH - LAYOUT_DIMENSIONS.SCREEN_PADDING,
  LAYOUT_DIMENSIONS.MAX_CONTAINER_SIZE
);

interface BreathingVisualizerProps {
  inhaleSec?: number;
  holdInSec?: number;
  exhaleSec?: number;
  holdOutSec?: number;
  onCycleComplete?: () => void;
}

const PHASE_COLORS: Record<BreathPhase, string> = {
  [BREATH_PHASE.INHALE]: COLORS.inhale,    // #10B981 Soft Emerald
  [BREATH_PHASE.HOLD_IN]: COLORS.hold,     // #F59E0B Soft Amber
  [BREATH_PHASE.EXHALE]: COLORS.exhale,    // #818CF8 Gentle Periwinkle
  [BREATH_PHASE.HOLD_OUT]: '#64748B',      // Deep Slate Neutral
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  [BREATH_PHASE.INHALE]: 'Inhale Deeply',
  [BREATH_PHASE.HOLD_IN]: 'Hold Breath',
  [BREATH_PHASE.EXHALE]: 'Exhale Slowly',
  [BREATH_PHASE.HOLD_OUT]: 'Rest & Pause',
};

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  inhaleSec = BREATHING_CONSTANTS.DEFAULT_PHASE_DURATION_SEC,
  holdInSec = BREATHING_CONSTANTS.DEFAULT_PHASE_DURATION_SEC,
  exhaleSec = BREATHING_CONSTANTS.DEFAULT_PHASE_DURATION_SEC,
  holdOutSec = BREATHING_CONSTANTS.DEFAULT_PHASE_DURATION_SEC,
  onCycleComplete,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>(BREATH_PHASE.INHALE);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(inhaleSec);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  // Reanimated 3 Shared Values
  const scale = useSharedValue<number>(BREATHING_CONSTANTS.ORB_MIN_SCALE);
  const ringOpacity = useSharedValue<number>(BREATHING_CONSTANTS.OPACITY_LOW);
  const auraPulse = useSharedValue<number>(1.0);

  const phaseRef = useRef<BreathPhase>(BREATH_PHASE.INHALE);
  phaseRef.current = phase;

  const triggerHapticFeedback = useCallback(async () => {
    await HapticService.breathInhalePulse();
  }, []);

  const handlePhaseTransition = useCallback(
    (nextPhase: BreathPhase) => {
      triggerHapticFeedback();
      setPhase(nextPhase);

      let durationSeconds: number = BREATHING_CONSTANTS.DEFAULT_PHASE_DURATION_SEC;
      switch (nextPhase) {
        case BREATH_PHASE.INHALE:
          durationSeconds = inhaleSec;
          break;
        case BREATH_PHASE.HOLD_IN:
          durationSeconds = holdInSec;
          break;
        case BREATH_PHASE.EXHALE:
          durationSeconds = exhaleSec;
          break;
        case BREATH_PHASE.HOLD_OUT:
          durationSeconds = holdOutSec;
          break;
      }

      const durationMs = durationSeconds * LAYOUT_DIMENSIONS.MS_PER_SECOND;
      setSecondsRemaining(durationSeconds);

      // Smooth, continuous sine motion curves
      switch (nextPhase) {
        case BREATH_PHASE.INHALE:
          scale.value = withTiming(BREATHING_CONSTANTS.ORB_MAX_SCALE, {
            duration: durationMs,
            easing: Easing.inOut(Easing.sin),
          });
          ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_MID, { duration: durationMs });
          break;

        case BREATH_PHASE.HOLD_IN:
          const halfMs = durationMs / 2;
          scale.value = withSequence(
            withTiming(BREATHING_CONSTANTS.ORB_PULSE_SCALE, {
              duration: halfMs,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(BREATHING_CONSTANTS.ORB_MAX_SCALE, {
              duration: halfMs,
              easing: Easing.inOut(Easing.sin),
            })
          );
          ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_FULL, { duration: durationMs });
          break;

        case BREATH_PHASE.EXHALE:
          scale.value = withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, {
            duration: durationMs,
            easing: Easing.inOut(Easing.sin),
          });
          ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_LOW, { duration: durationMs });
          break;

        case BREATH_PHASE.HOLD_OUT:
          const halfRestMs = durationMs / 2;
          scale.value = withSequence(
            withTiming(BREATHING_CONSTANTS.ORB_REST_SCALE, {
              duration: halfRestMs,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, {
              duration: halfRestMs,
              easing: Easing.inOut(Easing.sin),
            })
          );
          ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_MIN, { duration: durationMs });
          break;
      }
    },
    [inhaleSec, holdInSec, exhaleSec, holdOutSec, scale, ringOpacity, triggerHapticFeedback]
  );

  // Main Cycle Timer Loop
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        const isTimerFinished = prev <= 1;

        if (!isTimerFinished) {
          return prev - 1;
        }

        // Advance to next phase boundary using switch case
        const current = phaseRef.current;
        switch (current) {
          case BREATH_PHASE.INHALE:
            handlePhaseTransition(BREATH_PHASE.HOLD_IN);
            break;

          case BREATH_PHASE.HOLD_IN:
            handlePhaseTransition(BREATH_PHASE.EXHALE);
            break;

          case BREATH_PHASE.EXHALE:
            handlePhaseTransition(BREATH_PHASE.HOLD_OUT);
            break;

          case BREATH_PHASE.HOLD_OUT:
            setCompletedCycles((c) => c + 1);
            if (onCycleComplete) {
              onCycleComplete();
            }
            handlePhaseTransition(BREATH_PHASE.INHALE);
            break;
        }
        return BREATHING_CONSTANTS.DEFAULT_PHASE_DURATION_SEC;
      });
    }, BREATHING_CONSTANTS.TIMER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isActive, handlePhaseTransition, onCycleComplete]);

  // Gentle ambient radial aura pulse
  useEffect(() => {
    auraPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 3500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [auraPulse]);

  const toggleSession = async (): Promise<void> => {
    await triggerHapticFeedback();
    const willActivate = !isActive;

    if (willActivate) {
      setIsActive(true);
      handlePhaseTransition(BREATH_PHASE.INHALE);
    } else {
      setIsActive(false);
      scale.value = withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, { duration: 600 });
      ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_LOW, { duration: 600 });
    }
  };

  const resetSession = async (): Promise<void> => {
    await triggerHapticFeedback();
    setIsActive(false);
    setPhase(BREATH_PHASE.INHALE);
    setSecondsRemaining(inhaleSec);
    setCompletedCycles(0);
    scale.value = withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, { duration: 500 });
    ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_LOW, { duration: 500 });
  };

  // Reanimated Animated Styles
  const orbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const auraAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: ringOpacity.value,
      transform: [{ scale: scale.value * auraPulse.value * 1.25 }],
    };
  });

  const currentColor = PHASE_COLORS[phase];
  const hasCompletedCycles = completedCycles > 0;

  return (
    <View style={styles.container}>
      {/* Visualizer Aura & Orb Stage */}
      <View style={[styles.visualizerStage, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
        {/* SVG Radial Glow Background */}
        <Animated.View style={[StyleSheet.absoluteFillObject, auraAnimatedStyle]}>
          <Svg height={CONTAINER_SIZE} width={CONTAINER_SIZE} viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}>
            <Defs>
              <RadialGradient id="breathAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={currentColor} stopOpacity="0.45" />
                <Stop offset="65%" stopColor={currentColor} stopOpacity="0.12" />
                <Stop offset="100%" stopColor={COLORS.background} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={CONTAINER_SIZE / 2}
              cy={CONTAINER_SIZE / 2}
              r={CONTAINER_SIZE / 2 - 10}
              fill="url(#breathAura)"
            />
          </Svg>
        </Animated.View>

        {/* Outer Ring Border */}
        <View style={[styles.outerRing, { borderColor: `${currentColor}33` }]} />

        {/* Central Breathing Orb */}
        <Animated.View
          style={[
            styles.breathingOrb,
            {
              backgroundColor: currentColor,
              shadowColor: currentColor,
            },
            orbAnimatedStyle,
          ]}
        >
          <Wind size={36} color="#FFFFFF" opacity={0.9} />
        </Animated.View>
      </View>

      {/* Phase Label & Countdown Display */}
      <View style={styles.infoContainer}>
        {/* Text label crossfade requested in initial prompt (fades ONCE per phase) */}
        <Animated.View
          key={phase}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
        >
          <Text style={[styles.phaseTitle, { color: currentColor }]}>
            {PHASE_LABELS[phase]}
          </Text>
        </Animated.View>

        {/* Clean, static countdown timer text without per-second shaking or fading */}
        <Text style={styles.timerDisplay}>
          {isActive ? `${secondsRemaining}s` : 'Ready'}
        </Text>

        <Text style={styles.cycleBadgeText}>
          {hasCompletedCycles ? `${completedCycles} Cycles Completed` : '4-4-4-4 Box Breathing'}
        </Text>
      </View>

      {/* Control Buttons (Strict min 48x48dp touch targets) */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={resetSession}
          activeOpacity={0.8}
          accessibilityLabel="Reset Breathing Session"
        >
          <RefreshCw size={20} color={COLORS.body} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: isActive ? COLORS.surfaceElevated : currentColor },
            isActive && { borderColor: currentColor, borderWidth: 1 },
          ]}
          onPress={toggleSession}
          activeOpacity={0.85}
          accessibilityLabel={isActive ? 'Pause Session' : 'Start Session'}
        >
          {isActive ? (
            <Pause size={24} color={COLORS.title} />
          ) : (
            <Play size={24} color="#000000" style={{ marginLeft: 2 }} />
          )}
          <Text
            style={[
              styles.primaryButtonText,
              isActive ? { color: COLORS.title } : { color: '#000000' },
            ]}
          >
            {isActive ? 'Pause Session' : 'Begin Breathing'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  visualizerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: CONTAINER_SIZE - 20,
    height: CONTAINER_SIZE - 20,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  breathingOrb: {
    width: LAYOUT_DIMENSIONS.INNER_ORB_SIZE,
    height: LAYOUT_DIMENSIONS.INNER_ORB_SIZE,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  infoContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.title,
    letterSpacing: -1,
  },
  cycleBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.body,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  secondaryButton: {
    width: HARDWARE.minTouchTarget,
    height: HARDWARE.minTouchTarget,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: HARDWARE.minTouchTarget,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
