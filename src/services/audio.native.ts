import { Audio } from 'expo-av';
import { SoundscapeType, SOUNDSCAPES } from '@/types';

const NATIVE_SOUNDSCAPE_URLS: Record<string, string> = {
  [SOUNDSCAPES.WATERFALL]: 'https://raw.githubusercontent.com/Muges/ambientsounds/HEAD/stream.ogg',
  [SOUNDSCAPES.RAIN]: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  [SOUNDSCAPES.OCEAN]: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/main/audio/ocean.mp3',
  [SOUNDSCAPES.FIREPLACE]: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg',
  [SOUNDSCAPES.BREEZE]: 'https://actions.google.com/sounds/v1/weather/wind.ogg',
  [SOUNDSCAPES.COSMIC]: 'https://actions.google.com/sounds/v1/science_fiction/alien_song.ogg',
  [SOUNDSCAPES.ALPHA]: 'https://actions.google.com/sounds/v1/household/bowl.ogg',
};

const NATIVE_AUDIO_CONSTANTS = {
  DEFAULT_VOLUME: 0.55,
  MASTER_GAIN: 0.75,
} as const;

export class AudioService {
  private static soundInstance: Audio.Sound | null = null;
  private static currentSoundscape: SoundscapeType = SOUNDSCAPES.OFF;

  /** Initialize native audio mode with Android background audio support */
  static async initAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.warn('[AudioService Native] Audio mode init error:', error);
    }
  }

  /** Play custom user audio file or stream on native */
  static async playCustomAudio(audioUri: string): Promise<void> {
    await AudioService.stopSoundscape();
    AudioService.currentSoundscape = 'custom' as SoundscapeType;

    try {
      await AudioService.initAudio();
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: true,
          isLooping: true,
          volume: NATIVE_AUDIO_CONSTANTS.DEFAULT_VOLUME,
        }
      );
      AudioService.soundInstance = sound;
    } catch (error) {
      console.warn('[AudioService Native] Custom audio playback error:', error);
    }
  }

  /** Play ambient soundscape on native Android / iOS using expo-av */
  static async playSoundscape(type: SoundscapeType): Promise<void> {
    await AudioService.stopSoundscape();
    AudioService.currentSoundscape = type;

    const isOffType = type === SOUNDSCAPES.OFF;
    if (isOffType) return;

    const soundUrl = NATIVE_SOUNDSCAPE_URLS[type];
    const hasValidUrl = Boolean(soundUrl && soundUrl.length > 0);

    if (!hasValidUrl) {
      console.warn(`[AudioService Native] No sound URL found for soundscape: ${type}`);
      return;
    }

    try {
      await AudioService.initAudio();
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        {
          shouldPlay: true,
          isLooping: true,
          volume: NATIVE_AUDIO_CONSTANTS.MASTER_GAIN,
        }
      );
      AudioService.soundInstance = sound;
    } catch (error) {
      console.warn('[AudioService Native] Soundscape playback error:', error);
    }
  }

  /** Stop native ambient soundscape */
  static async stopSoundscape(): Promise<void> {
    const hasActiveSound = Boolean(AudioService.soundInstance);
    if (hasActiveSound && AudioService.soundInstance) {
      try {
        await AudioService.soundInstance.stopAsync();
        await AudioService.soundInstance.unloadAsync();
        AudioService.soundInstance = null;
      } catch {
        // Ignore unload errors
      }
    }
    AudioService.currentSoundscape = SOUNDSCAPES.OFF;
  }

  /** Get active soundscape */
  static getCurrentSoundscape(): SoundscapeType {
    return AudioService.currentSoundscape;
  }
}
