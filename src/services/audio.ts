import { Audio } from 'expo-av';

export class AudioService {
  private static soundInstance: Audio.Sound | null = null;
  private static isMuted: boolean = false;

  /** Initialize audio context */
  static async initAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('[AudioService] Failed to set audio mode:', error);
    }
  }

  /** Set mute state */
  static setMuted(muted: boolean): void {
    AudioService.isMuted = muted;
    if (AudioService.soundInstance) {
      AudioService.soundInstance.setIsMutedAsync(muted).catch(() => {});
    }
  }

  /** Get mute state */
  static getMuted(): boolean {
    return AudioService.isMuted;
  }

  /** Unload playing sound */
  static async stopAndUnload(): Promise<void> {
    if (AudioService.soundInstance) {
      try {
        await AudioService.soundInstance.stopAsync();
        await AudioService.soundInstance.unloadAsync();
        AudioService.soundInstance = null;
      } catch (error) {
        console.error('[AudioService] Error unloading sound:', error);
      }
    }
  }
}
