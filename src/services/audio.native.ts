import { Audio } from 'expo-av';
import { SoundscapeType, SOUNDSCAPES } from '@/types';

export class AudioService {
  private static soundInstance: Audio.Sound | null = null;
  private static currentSoundscape: SoundscapeType = SOUNDSCAPES.OFF;

  /** Initialize native audio mode */
  static async initAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
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
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, isLooping: true, volume: 0.55 }
      );
      AudioService.soundInstance = sound;
    } catch (error) {
      console.warn('[AudioService Native] Custom audio playback error:', error);
    }
  }

  /** Play ambient soundscape on native */
  static async playSoundscape(type: SoundscapeType): Promise<void> {
    await AudioService.stopSoundscape();
    AudioService.currentSoundscape = type;

    if (type === SOUNDSCAPES.OFF) return;

    try {
      // Placeholder for native soundscape playback
      console.log(`[AudioService Native] Playing soundscape: ${type}`);
    } catch (error) {
      console.warn('[AudioService Native] Soundscape playback error:', error);
    }
  }

  /** Stop native ambient soundscape */
  static async stopSoundscape(): Promise<void> {
    if (AudioService.soundInstance) {
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
