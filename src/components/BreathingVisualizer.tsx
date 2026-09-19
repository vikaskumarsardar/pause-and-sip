import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  Play,
  Pause,
  RefreshCw,
  Wind,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Sparkles,
  Flame,
  Trees,
  Sun,
  Plus,
  Trash2,
  X,
  Check,
  Music,
  Upload,
  Crown,
} from 'lucide-react-native';

import {
  BreathPhase,
  BREATH_PHASE,
  BREATHING_CONSTANTS,
  BREATH_PRESETS,
  BreathPattern,
  CustomSoundItem,
  SOUNDSCAPES,
  SOUNDSCAPE_LIST,
  SoundscapeType,
} from '@/types';
import { COLORS, SPACING, RADIUS, HARDWARE } from '@/theme';
import { HapticService } from '@/services/haptics';
import { AudioService } from '@/services/audio';
import { StorageService } from '@/services/storage';

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
  onCycleComplete?: () => void;
  isPro?: boolean;
  onOpenPaywall?: () => void;
}

const PHASE_COLORS: Record<BreathPhase, string> = {
  [BREATH_PHASE.INHALE]: COLORS.inhale,    // #10B981 Soft Emerald
  [BREATH_PHASE.HOLD_IN]: COLORS.hold,     // #F59E0B Soft Amber
  [BREATH_PHASE.EXHALE]: COLORS.exhale,    // #818CF8 Gentle Lavender
  [BREATH_PHASE.HOLD_OUT]: '#64748B',      // Deep Slate Neutral
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  [BREATH_PHASE.INHALE]: 'Inhale Deeply',
  [BREATH_PHASE.HOLD_IN]: 'Hold Breath',
  [BREATH_PHASE.EXHALE]: 'Exhale Slowly',
  [BREATH_PHASE.HOLD_OUT]: 'Rest & Pause',
};

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  onCycleComplete,
  isPro = false,
  onOpenPaywall,
}) => {
  const [customPatterns, setCustomPatterns] = useState<BreathPattern[]>([]);
  const [customSounds, setCustomSounds] = useState<CustomSoundItem[]>([]);
  const [activePreset, setActivePreset] = useState<BreathPattern>(BREATH_PRESETS[0]);
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>(SOUNDSCAPES.OFF);
  const [activeCustomSoundId, setActiveCustomSoundId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>(BREATH_PHASE.INHALE);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(activePreset.inhaleDurationSec);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  // Modal State for Custom Rhythm CRUD
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customInhale, setCustomInhale] = useState<number>(4);
  const [customHoldIn, setCustomHoldIn] = useState<number>(4);
  const [customExhale, setCustomExhale] = useState<number>(4);
  const [customHoldOut, setCustomHoldOut] = useState<number>(4);

  // Modal State for Custom Sound Upload
  const [isSoundModalOpen, setIsSoundModalOpen] = useState<boolean>(false);
  const [soundName, setSoundName] = useState<string>('');
  const [soundUri, setSoundUri] = useState<string>('');

  // Shared Values for Reanimated 3 Animation
  const scale = useSharedValue<number>(BREATHING_CONSTANTS.ORB_MIN_SCALE);
  const ringOpacity = useSharedValue<number>(BREATHING_CONSTANTS.OPACITY_LOW);
  const rotation = useSharedValue<number>(0);

  const phaseRef = useRef<BreathPhase>(BREATH_PHASE.INHALE);
  phaseRef.current = phase;

  // Load user custom patterns & custom sounds on mount
  useEffect(() => {
    StorageService.getCustomPatterns().then(setCustomPatterns);
    StorageService.getCustomSounds().then(setCustomSounds);
    rotation.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const triggerHapticFeedback = useCallback(async () => {
    await HapticService.breathInhalePulse();
  }, []);

  const handlePhaseTransition = useCallback(
    (nextPhase: BreathPhase) => {
      triggerHapticFeedback();
      setPhase(nextPhase);

      let durationSeconds: number = activePreset.inhaleDurationSec;
      switch (nextPhase) {
        case BREATH_PHASE.INHALE:
          durationSeconds = activePreset.inhaleDurationSec;
          break;
        case BREATH_PHASE.HOLD_IN:
          durationSeconds = activePreset.holdInDurationSec;
          break;
        case BREATH_PHASE.EXHALE:
          durationSeconds = activePreset.exhaleDurationSec;
          break;
        case BREATH_PHASE.HOLD_OUT:
          durationSeconds = activePreset.holdOutDurationSec;
          break;
      }

      const durationMs = durationSeconds * LAYOUT_DIMENSIONS.MS_PER_SECOND;
      setSecondsRemaining(durationSeconds);

      // Smooth sine motion curves
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
    [activePreset, scale, ringOpacity, triggerHapticFeedback]
  );

  // Main Cycle Timer Loop
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        const isTimerFinished = prev <= 1;

        if (!isTimerFinished) {
          HapticService.countdownTick();
          return prev - 1;
        }

        const current = phaseRef.current;
        switch (current) {
          case BREATH_PHASE.INHALE:
            if (activePreset.holdInDurationSec > 0) {
              handlePhaseTransition(BREATH_PHASE.HOLD_IN);
            } else {
              handlePhaseTransition(BREATH_PHASE.EXHALE);
            }
            break;

          case BREATH_PHASE.HOLD_IN:
            handlePhaseTransition(BREATH_PHASE.EXHALE);
            break;

          case BREATH_PHASE.EXHALE:
            if (activePreset.holdOutDurationSec > 0) {
              handlePhaseTransition(BREATH_PHASE.HOLD_OUT);
            } else {
              setCompletedCycles((c) => c + 1);
              if (onCycleComplete) onCycleComplete();
              handlePhaseTransition(BREATH_PHASE.INHALE);
            }
            break;

          case BREATH_PHASE.HOLD_OUT:
            setCompletedCycles((c) => c + 1);
            if (onCycleComplete) onCycleComplete();
            handlePhaseTransition(BREATH_PHASE.INHALE);
            break;
        }
        return activePreset.inhaleDurationSec;
      });
    }, BREATHING_CONSTANTS.TIMER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isActive, activePreset, handlePhaseTransition, onCycleComplete]);

  const toggleSession = async (): Promise<void> => {
    await HapticService.mediumTouch();
    const nextActive = !isActive;
    setIsActive(nextActive);

    if (nextActive) {
      handlePhaseTransition(BREATH_PHASE.INHALE);
    } else {
      scale.value = withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, { duration: 400 });
      ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_LOW, { duration: 400 });
      setPhase(BREATH_PHASE.INHALE);
      setSecondsRemaining(activePreset.inhaleDurationSec);
    }
  };

  const resetSession = async (): Promise<void> => {
    await HapticService.warning();
    setIsActive(false);
    scale.value = withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, { duration: 300 });
    ringOpacity.value = withTiming(BREATHING_CONSTANTS.OPACITY_LOW, { duration: 300 });
    setPhase(BREATH_PHASE.INHALE);
    setSecondsRemaining(activePreset.inhaleDurationSec);
    setCompletedCycles(0);
  };

  const selectPreset = async (preset: BreathPattern): Promise<void> => {
    const isProPreset = preset.isPro;
    const isUserNotPro = !isPro;
    const isLockedProPreset = Boolean(isProPreset && isUserNotPro);

    if (isLockedProPreset) {
      await HapticService.warning();
      if (onOpenPaywall) onOpenPaywall();
      return;
    }
    await HapticService.lightTouch();
    setActivePreset(preset);
    setIsActive(false);
    setPhase(BREATH_PHASE.INHALE);
    setSecondsRemaining(preset.inhaleDurationSec);
    scale.value = withTiming(BREATHING_CONSTANTS.ORB_MIN_SCALE, { duration: 300 });
  };

  const toggleSoundscape = async (type: SoundscapeType, isProSoundscape?: boolean): Promise<void> => {
    const isUserNotPro = !isPro;
    const isLockedProSoundscape = Boolean(isProSoundscape && isUserNotPro);

    if (isLockedProSoundscape) {
      await HapticService.warning();
      if (onOpenPaywall) onOpenPaywall();
      return;
    }
    await HapticService.lightTouch();
    setActiveCustomSoundId(null);
    const nextType = activeSoundscape === type ? SOUNDSCAPES.OFF : type;
    setActiveSoundscape(nextType);
    await AudioService.playSoundscape(nextType);
  };

  const playCustomSound = async (sound: CustomSoundItem): Promise<void> => {
    await HapticService.lightTouch();
    if (activeCustomSoundId === sound.id) {
      setActiveCustomSoundId(null);
      setActiveSoundscape(SOUNDSCAPES.OFF);
      AudioService.stopSoundscape();
    } else {
      setActiveCustomSoundId(sound.id);
      setActiveSoundscape('custom' as SoundscapeType);
      await AudioService.playCustomAudio(sound.uri);
    }
  };

  // Custom Rhythm CRUD Handlers
  const handleSaveCustomPattern = async (): Promise<void> => {
    if (!customName.trim()) return;
    await HapticService.success();
    const updated = await StorageService.saveCustomPattern({
      name: customName.trim(),
      description: `${customInhale}-${customHoldIn}-${customExhale}-${customHoldOut} custom rhythm`,
      inhaleDurationSec: customInhale,
      holdInDurationSec: customHoldIn,
      exhaleDurationSec: customExhale,
      holdOutDurationSec: customHoldOut,
      phases: [],
    });
    setCustomPatterns(updated);
    if (updated.length > 0) {
      selectPreset(updated[0]);
    }
    setIsModalOpen(false);
    setCustomName('');
  };

  const handleDeleteCustomPattern = async (id: string): Promise<void> => {
    await HapticService.warning();
    const remaining = await StorageService.deleteCustomPattern(id);
    setCustomPatterns(remaining);
    if (activePreset.id === id) {
      selectPreset(BREATH_PRESETS[0]);
    }
  };

  // Custom Sound Upload Handlers
  const handleFileUploadWeb = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSoundUri(dataUrl);
      if (!soundName) {
        setSoundName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomSound = async (): Promise<void> => {
    if (!soundName.trim() || !soundUri.trim()) return;
    await HapticService.success();
    const updated = await StorageService.saveCustomSound({
      name: soundName.trim(),
      uri: soundUri.trim(),
    });
    setCustomSounds(updated);
    if (updated.length > 0) {
      playCustomSound(updated[0]);
    }
    setIsSoundModalOpen(false);
    setSoundName('');
    setSoundUri('');
  };

  const handleDeleteCustomSound = async (id: string): Promise<void> => {
    await HapticService.warning();
    const remaining = await StorageService.deleteCustomSound(id);
    setCustomSounds(remaining);
    if (activeCustomSoundId === id) {
      setActiveCustomSoundId(null);
      AudioService.stopSoundscape();
    }
  };

  // Reanimated Animated Styles
  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [
      { scale: scale.value * 1.25 },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const currentColor = PHASE_COLORS[phase];
  const hasCompletedCycles = completedCycles > 0;
  const allPatterns = [...BREATH_PRESETS, ...customPatterns];

  return (
    <View style={styles.container}>
      {/* Top Rhythm Preset Selector Bar */}
      <View style={styles.presetsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
          {allPatterns.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <View key={preset.id} style={styles.presetChipWrapper}>
                <TouchableOpacity
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => selectPreset(preset)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                    {preset.name}
                  </Text>
                  {preset.isPro && !isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 4 }} />}
                  {preset.isCustom && (
                    <TouchableOpacity
                      style={styles.deleteChipIcon}
                      onPress={() => handleDeleteCustomPattern(preset.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={12} color={COLORS.muted} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add Custom Rhythm Button */}
          <TouchableOpacity
            style={styles.addPresetChip}
            onPress={() => {
              if (!isPro) {
                HapticService.warning();
                if (onOpenPaywall) onOpenPaywall();
                return;
              }
              HapticService.lightTouch();
              setIsModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={14} color={COLORS.emerald} />
            <Text style={styles.addPresetText}>Custom</Text>
            {!isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Visualizer Stage: 3D Liquid Particle Nebula */}
      <View style={[styles.visualizerStage, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, auraAnimatedStyle]}>
          <Svg height={CONTAINER_SIZE} width={CONTAINER_SIZE} viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}>
            <Defs>
              <RadialGradient id="nebulaAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={currentColor} stopOpacity="0.55" />
                <Stop offset="60%" stopColor={currentColor} stopOpacity="0.18" />
                <Stop offset="100%" stopColor={COLORS.background} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={CONTAINER_SIZE / 2}
              cy={CONTAINER_SIZE / 2}
              r={CONTAINER_SIZE / 2 - 10}
              fill="url(#nebulaAura)"
            />

            {[
              { ringR: CONTAINER_SIZE / 2 - 15, count: 12, dotR: 3.5, opacity: 0.9 },
              { ringR: CONTAINER_SIZE / 2 - 35, count: 8, dotR: 2.5, opacity: 0.6 },
              { ringR: CONTAINER_SIZE / 2 - 55, count: 4, dotR: 2.0, opacity: 0.4 },
            ].map((ring, ringIdx) =>
              Array.from({ length: ring.count }).map((_, idx) => {
                const angle = (idx * (360 / ring.count)) * (Math.PI / 180);
                const cx = CONTAINER_SIZE / 2 + ring.ringR * Math.cos(angle);
                const cy = CONTAINER_SIZE / 2 + ring.ringR * Math.sin(angle);
                return (
                  <Circle
                    key={`r${ringIdx}-d${idx}`}
                    cx={cx}
                    cy={cy}
                    r={ring.dotR}
                    fill={currentColor}
                    opacity={isActive ? ring.opacity : ring.opacity * 0.4}
                  />
                );
              })
            )}
          </Svg>
        </Animated.View>

        <View style={[styles.outerRing, { borderColor: `${currentColor}44` }]} />

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

      {/* Phase Label & Timer Countdown Display */}
      <View style={styles.statusContainer}>
        <Text style={[styles.phaseText, { color: currentColor }]}>
          {isActive ? PHASE_LABELS[phase] : PHASE_LABELS[BREATH_PHASE.INHALE]}
        </Text>

        <Text style={styles.timerDisplay}>
          {isActive ? `${secondsRemaining}s` : 'Ready'}
        </Text>

        <Text style={styles.cycleBadgeText}>
          {hasCompletedCycles ? `${completedCycles} Cycles Completed` : activePreset.description}
        </Text>
      </View>

      {/* Ambient Mood Soundscapes & User Custom Audio Bar */}
      <View style={styles.soundscapeBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundscapeScroll}>
          {/* Preset Ambient Soundscapes */}
          {SOUNDSCAPE_LIST.map((item) => {
            const hasNoCustomActive = activeCustomSoundId === null;
            const isSelected = activeSoundscape === item.id && hasNoCustomActive;
            let IconComp = Waves;
            switch (item.id) {
              case SOUNDSCAPES.RAIN:
                IconComp = CloudRain;
                break;
              case SOUNDSCAPES.WATERFALL:
                IconComp = Waves;
                break;
              case SOUNDSCAPES.OCEAN:
                IconComp = Wind;
                break;
              case SOUNDSCAPES.FIREPLACE:
                IconComp = Flame;
                break;
              case SOUNDSCAPES.BREEZE:
                IconComp = Trees;
                break;
              case SOUNDSCAPES.COSMIC:
                IconComp = Sun;
                break;
              case SOUNDSCAPES.ALPHA:
                IconComp = Sparkles;
                break;
              default:
                IconComp = Waves;
                break;
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.soundChip, isSelected && styles.soundChipActive]}
                onPress={() => toggleSoundscape(item.id, item.isPro)}
                activeOpacity={0.8}
              >
                <IconComp size={14} color={isSelected ? COLORS.water : COLORS.body} />
                <Text style={[styles.soundChipText, isSelected && styles.soundChipTextActive]}>
                  {item.name}
                </Text>
                {item.isPro && !isPro && <Crown size={12} color={COLORS.gold} />}
              </TouchableOpacity>
            );
          })}

          {/* User Custom Uploaded Audio Chips */}
          {customSounds.map((sound) => {
            const isSelected = activeCustomSoundId === sound.id;
            return (
              <View key={sound.id} style={styles.presetChipWrapper}>
                <TouchableOpacity
                  style={[styles.soundChip, isSelected && styles.soundChipActive]}
                  onPress={() => playCustomSound(sound)}
                  activeOpacity={0.8}
                >
                  <Music size={14} color={isSelected ? COLORS.water : COLORS.gold} />
                  <Text style={[styles.soundChipText, isSelected && styles.soundChipTextActive]}>
                    {sound.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteChipIcon}
                    onPress={() => handleDeleteCustomSound(sound.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={12} color={COLORS.muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add Custom Audio Upload Chip */}
          <TouchableOpacity
            style={styles.addSoundChip}
            onPress={() => {
              if (!isPro) {
                HapticService.warning();
                if (onOpenPaywall) onOpenPaywall();
                return;
              }
              HapticService.lightTouch();
              setIsSoundModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={14} color={COLORS.water} />
            <Text style={styles.addSoundText}>Audio FX</Text>
            {!isPro && <Crown size={12} color={COLORS.gold} style={{ marginLeft: 2 }} />}
          </TouchableOpacity>
        </ScrollView>

        {(() => {
          const isAudioMuted = activeSoundscape === SOUNDSCAPES.OFF && activeCustomSoundId === null;
          return (
            <TouchableOpacity
              style={[styles.soundChipMute, isAudioMuted && styles.soundChipActive]}
              onPress={() => toggleSoundscape(SOUNDSCAPES.OFF)}
              activeOpacity={0.8}
            >
              {isAudioMuted ? (
                <VolumeX size={14} color={COLORS.muted} />
              ) : (
                <Volume2 size={14} color={COLORS.title} />
              )}
            </TouchableOpacity>
          );
        })()}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={resetSession}
          activeOpacity={0.8}
          accessibilityLabel="Reset Session"
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
          accessibilityLabel={isActive ? 'Pause Session' : 'Begin Breathing'}
        >
          {isActive ? (
            <Pause size={24} color={COLORS.title} />
          ) : (
            <Play size={24} color="#000000" style={{ marginLeft: 2 }} />
          )}
          <Text
            style={[
              styles.primaryButtonText,
              { color: isActive ? COLORS.title : '#000000' },
            ]}
          >
            {isActive ? 'Pause Session' : 'Begin Breathing'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Rhythm Creator Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Rhythm</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={COLORS.body} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Pattern Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sunset Calmer"
                placeholderTextColor={COLORS.muted}
                value={customName}
                onChangeText={setCustomName}
              />

              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Inhale Duration</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomInhale((v) => Math.max(1, v - 1))}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{customInhale}s</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomInhale((v) => Math.min(15, v + 1))}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Hold In Duration</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomHoldIn((v) => Math.max(0, v - 1))}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{customHoldIn}s</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomHoldIn((v) => Math.min(15, v + 1))}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Exhale Duration</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomExhale((v) => Math.max(1, v - 1))}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{customExhale}s</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomExhale((v) => Math.min(15, v + 1))}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Hold Out Duration</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomHoldOut((v) => Math.max(0, v - 1))}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{customHoldOut}s</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setCustomHoldOut((v) => Math.min(15, v + 1))}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveCustomPattern}
                activeOpacity={0.85}
              >
                <Check size={18} color="#000000" />
                <Text style={styles.saveModalBtnText}>Save Custom Rhythm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Audio Upload Modal */}
      <Modal visible={isSoundModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Sound FX</Text>
              <TouchableOpacity onPress={() => setIsSoundModalOpen(false)}>
                <X size={20} color={COLORS.body} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Sound Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. My Forest Stream"
                placeholderTextColor={COLORS.muted}
                value={soundName}
                onChangeText={setSoundName}
              />

              {/* Web Local Audio File Picker */}
              {Platform.OS === 'web' && (
                <View style={styles.uploadBox}>
                  <Upload size={20} color={COLORS.water} />
                  <Text style={styles.uploadBoxText}>Choose Local MP3/WAV File</Text>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUploadWeb}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      opacity: 0,
                      cursor: 'pointer',
                    } as any}
                  />
                </View>
              )}

              <Text style={styles.inputLabel}>Or Direct Sound Stream URL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://example.com/audio.mp3"
                placeholderTextColor={COLORS.muted}
                value={soundUri}
                onChangeText={setSoundUri}
              />

              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: COLORS.water }]}
                onPress={handleSaveCustomSound}
                activeOpacity={0.85}
              >
                <Check size={18} color="#000000" />
                <Text style={styles.saveModalBtnText}>Save Sound FX</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    width: '100%',
    flex: 1,
  },
  presetsBar: {
    width: '100%',
    maxHeight: 40,
    marginBottom: 4,
  },
  presetsScroll: {
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  presetChipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  presetChipActive: {
    borderColor: COLORS.emerald,
    backgroundColor: `${COLORS.emerald}22`,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.body,
  },
  presetChipTextActive: {
    color: COLORS.emerald,
    fontWeight: '700',
  },
  deleteChipIcon: {
    marginLeft: 2,
    padding: 2,
  },
  addPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.emerald}15`,
    borderWidth: 1,
    borderColor: `${COLORS.emerald}44`,
  },
  addPresetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.emerald,
  },
  visualizerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: SPACING.xs,
  },
  outerRing: {
    position: 'absolute',
    width: CONTAINER_SIZE - 20,
    height: CONTAINER_SIZE - 20,
    borderRadius: (CONTAINER_SIZE - 20) / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  breathingOrb: {
    width: LAYOUT_DIMENSIONS.INNER_ORB_SIZE,
    height: LAYOUT_DIMENSIONS.INNER_ORB_SIZE,
    borderRadius: LAYOUT_DIMENSIONS.INNER_ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 2,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  timerDisplay: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.title,
    letterSpacing: -1,
  },
  cycleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.body,
  },
  soundscapeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    maxWidth: '100%',
  },
  soundscapeScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  soundChip: {
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
  soundChipMute: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundChipActive: {
    borderColor: COLORS.water,
    backgroundColor: COLORS.surface,
  },
  soundChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.body,
  },
  soundChipTextActive: {
    color: COLORS.title,
  },
  addSoundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.water}15`,
    borderWidth: 1,
    borderColor: `${COLORS.water}44`,
  },
  addSoundText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.water,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: 4,
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
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.title,
  },
  modalBody: {
    gap: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.body,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.title,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  uploadBox: {
    position: 'relative',
    height: 48,
    backgroundColor: `${COLORS.water}15`,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${COLORS.water}66`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.water,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.body,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.title,
  },
  counterVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.emerald,
    minWidth: 28,
    textAlign: 'center',
  },
  saveModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.emerald,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
});
