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
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Play, Pause, RefreshCw, Wind } from 'lucide-react-native';

import { BreathPhase } from '../types';
import { COLORS, SPACING, RADIUS, HARDWARE } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 64, 300);
const INNER_ORB_SIZE = 140;

interface BreathingVisualizerProps {
  inhaleSec?: number;
  holdInSec?: number;
  exhaleSec?: number;
  holdOutSec?: number;
  onCycleComplete?: () => void;
}

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: COLORS.inhale,  // #10B981 Soft Emerald
  holdIn: COLORS.hold,    // #F59E0B Soft Amber
  exhale: COLORS.exhale,  // #818CF8 Gentle Periwinkle
  holdOut: '#64748B',     // Deep Slate Neutral
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Inhale Deeply',
  holdIn: 'Hold Breath',
  exhale: 'Exhale Slowly',
  holdOut: 'Rest & Pause',
};

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  inhaleSec = 4,
  holdInSec = 4,
  exhaleSec = 4,
  holdOutSec = 4,
  onCycleComplete,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(inhaleSec);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  // Reanimated 3 Shared Values
  const scale = useSharedValue<number>(0.45);
  const ringOpacity = useSharedValue<number>(0.3);
  const auraRotation = useSharedValue<number>(0);

  const phaseRef = useRef<BreathPhase>('inhale');
  phaseRef.current = phase;

  const triggerHapticFeedback = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback on non-supported hardware
    }
  }, []);

  const handlePhaseTransition = useCallback((nextPhase: BreathPhase) => {
    triggerHapticFeedback();
    setPhase(nextPhase);

    let durationMs = 4000;
    if (nextPhase === 'inhale') durationMs = inhaleSec * 1000;
    if (nextPhase === 'holdIn') durationMs = holdInSec * 1000;
    if (nextPhase === 'exhale') durationMs = exhaleSec * 1000;
    if (nextPhase === 'holdOut') durationMs = holdOutSec * 1000;

    setSecondsRemaining(Math.round(durationMs / 1000));

    // Animate scale & opacity on UI thread
    if (nextPhase === 'inhale') {
      scale.value = withTiming(1.0, {
        duration: durationMs,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
      });
      ringOpacity.value = withTiming(0.85, { duration: durationMs });
    } else if (nextPhase === 'holdIn') {
      scale.value = withSequence(
        withTiming(1.03, { duration: durationMs / 2 }),
        withTiming(1.0, { duration: durationMs / 2 })
      );
      ringOpacity.value = withTiming(0.95, { duration: durationMs });
    } else if (nextPhase === 'exhale') {
      scale.value = withTiming(0.45, {
        duration: durationMs,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
      });
      ringOpacity.value = withTiming(0.25, { duration: durationMs });
    } else if (nextPhase === 'holdOut') {
      scale.value = withTiming(0.42, { duration: durationMs });
      ringOpacity.value = withTiming(0.15, { duration: durationMs });
    }
  }, [inhaleSec, holdInSec, exhaleSec, holdOutSec, scale, ringOpacity, triggerHapticFeedback]);

  // Main Cycle Timer Loop
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Advance to next phase boundary
        const current = phaseRef.current;
        if (current === 'inhale') {
          handlePhaseTransition('holdIn');
        } else if (current === 'holdIn') {
          handlePhaseTransition('exhale');
        } else if (current === 'exhale') {
          handlePhaseTransition('holdOut');
        } else {
          // Cycle completed!
          setCompletedCycles((c) => c + 1);
          if (onCycleComplete) {
            onCycleComplete();
          }
          handlePhaseTransition('inhale');
        }
        return 4;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, handlePhaseTransition, onCycleComplete]);

  // Subtle background aura rotation animation
  useEffect(() => {
    auraRotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, [auraRotation]);

  const toggleSession = async (): Promise<void> => {
    triggerHapticFeedback();
    if (!isActive) {
      setIsActive(true);
      handlePhaseTransition('inhale');
    } else {
      setIsActive(false);
      scale.value = withTiming(0.45, { duration: 600 });
      ringOpacity.value = withTiming(0.3, { duration: 600 });
    }
  };

  const resetSession = async (): Promise<void> => {
    triggerHapticFeedback();
    setIsActive(false);
    setPhase('inhale');
    setSecondsRemaining(inhaleSec);
    setCompletedCycles(0);
    scale.value = withTiming(0.45, { duration: 500 });
    ringOpacity.value = withTiming(0.3, { duration: 500 });
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
      transform: [
        { scale: scale.value * 1.35 },
        { rotate: `${auraRotation.value}deg` },
      ],
    };
  });

  const currentColor = PHASE_COLORS[phase];

  return (
    <View style={styles.container}>
      {/* Visualizer Aura & Orb Container */}
      <View style={[styles.visualizerStage, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
        {/* SVG Radial Glow Background */}
        <Animated.View style={[StyleSheet.absoluteFillObject, auraAnimatedStyle]}>
          <Svg height={CONTAINER_SIZE} width={CONTAINER_SIZE} viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}>
            <Defs>
              <RadialGradient id="breathAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={currentColor} stopOpacity="0.4" />
                <Stop offset="60%" stopColor={currentColor} stopOpacity="0.1" />
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
        <Animated.View key={`${phase}-${secondsRemaining}`} entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)}>
          <Text style={[styles.phaseTitle, { color: currentColor }]}>
            {PHASE_LABELS[phase]}
          </Text>
        </Animated.View>

        <Text style={styles.timerDisplay}>
          {isActive ? `${secondsRemaining}s` : 'Ready'}
        </Text>

        <Text style={styles.cycleBadgeText}>
          {completedCycles > 0 ? `${completedCycles} Cycles Completed` : '4-4-4-4 Box Breathing'}
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
    width: INNER_ORB_SIZE,
    height: INNER_ORB_SIZE,
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
