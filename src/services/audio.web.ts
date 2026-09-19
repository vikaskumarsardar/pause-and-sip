import { SoundscapeType, SOUNDSCAPES, AUDIO_SYNTHESIS_CONSTANTS } from '@/types';

export class AudioService {
  private static audioCtx: AudioContext | null = null;
  private static activeSourceNodes: (AudioNode | OscillatorNode)[] = [];
  private static customAudioElement: HTMLAudioElement | null = null;
  private static masterGain: GainNode | null = null;
  private static currentSoundscape: SoundscapeType = SOUNDSCAPES.OFF;

  private static getContext(): AudioContext {
    if (!AudioService.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      AudioService.audioCtx = new AudioCtxClass();
      AudioService.masterGain = AudioService.audioCtx.createGain();
      AudioService.masterGain.gain.value = AUDIO_SYNTHESIS_CONSTANTS.MASTER_GAIN_DEFAULT;
      AudioService.masterGain.connect(AudioService.audioCtx.destination);
    }
    const isSuspended = AudioService.audioCtx.state === 'suspended';
    if (isSuspended) {
      AudioService.audioCtx.resume();
    }
    return AudioService.audioCtx;
  }

  /** Helper to generate pink noise buffer */
  private static createPinkNoiseBuffer(
    ctx: AudioContext,
    durationSec: number = AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_3SEC
  ): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSec;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return noiseBuffer;
  }

  /** Helper to generate white noise buffer */
  private static createWhiteNoiseBuffer(
    ctx: AudioContext,
    durationSec: number = AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_3SEC
  ): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSec;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.05;
    }
    return noiseBuffer;
  }

  /** Helper to generate wood crackle spark buffer for Fireplace */
  private static createCrackleBuffer(
    ctx: AudioContext,
    durationSec: number = AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_4SEC
  ): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSec;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const isCrackleImpulse = Math.random() < 0.0012;
      output[i] = isCrackleImpulse ? (Math.random() * 2 - 1) * 0.6 : 0;
    }
    return noiseBuffer;
  }

  /** Play custom user-uploaded or stream audio */
  static async playCustomAudio(audioUri: string): Promise<void> {
    AudioService.stopSoundscape();
    AudioService.currentSoundscape = 'custom' as SoundscapeType;

    try {
      const hasActiveCustomAudio = Boolean(AudioService.customAudioElement);
      if (hasActiveCustomAudio && AudioService.customAudioElement) {
        AudioService.customAudioElement.pause();
        AudioService.customAudioElement = null;
      }
      const audio = new Audio(audioUri);
      audio.loop = true;
      audio.volume = AUDIO_SYNTHESIS_CONSTANTS.CUSTOM_AUDIO_VOLUME;
      await audio.play();
      AudioService.customAudioElement = audio;
    } catch (error) {
      console.warn('[AudioService Web] Error playing custom audio:', error);
    }
  }

  /** Play selected ambient soundscape */
  static async playSoundscape(type: SoundscapeType): Promise<void> {
    AudioService.stopSoundscape();
    AudioService.currentSoundscape = type;

    const isTurnedOff = type === SOUNDSCAPES.OFF;
    if (isTurnedOff) return;

    try {
      const ctx = AudioService.getContext();
      const isMasterGainMissing = !AudioService.masterGain;
      if (isMasterGainMissing) return;

      switch (type) {
        case SOUNDSCAPES.WATERFALL: {
          const pinkBuffer = AudioService.createPinkNoiseBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_4SEC
          );
          const whiteBuffer = AudioService.createWhiteNoiseBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_4SEC
          );

          const pinkSource = ctx.createBufferSource();
          pinkSource.buffer = pinkBuffer;
          pinkSource.loop = true;

          const whiteSource = ctx.createBufferSource();
          whiteSource.buffer = whiteBuffer;
          whiteSource.loop = true;

          const bodyFilter = ctx.createBiquadFilter();
          bodyFilter.type = 'bandpass';
          bodyFilter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.WATERFALL_ROAR_FREQ;
          bodyFilter.Q.value = 0.85;

          const sprayFilter = ctx.createBiquadFilter();
          sprayFilter.type = 'highpass';
          sprayFilter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.WATERFALL_SPRAY_FREQ;

          const rumbleOsc = ctx.createOscillator();
          const rumbleGain = ctx.createGain();
          rumbleOsc.type = 'sine';
          rumbleOsc.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.WATERFALL_RUMBLE_FREQ;
          rumbleGain.gain.value = 0.05;

          const flowLfo = ctx.createOscillator();
          const flowLfoGain = ctx.createGain();
          flowLfo.type = 'sine';
          flowLfo.frequency.value = 0.14;
          flowLfoGain.gain.value = 180;

          flowLfo.connect(flowLfoGain);
          flowLfoGain.connect(bodyFilter.frequency);

          const waterfallBus = ctx.createGain();
          waterfallBus.gain.value = 0.5;

          pinkSource.connect(bodyFilter);
          bodyFilter.connect(waterfallBus);
          whiteSource.connect(sprayFilter);
          sprayFilter.connect(waterfallBus);
          rumbleOsc.connect(rumbleGain);
          rumbleGain.connect(waterfallBus);
          waterfallBus.connect(AudioService.masterGain!);

          pinkSource.start();
          whiteSource.start();
          rumbleOsc.start();
          flowLfo.start();

          AudioService.activeSourceNodes.push(
            pinkSource, whiteSource, bodyFilter, sprayFilter,
            rumbleOsc, rumbleGain, flowLfo, flowLfoGain, waterfallBus
          );
          break;
        }

        case SOUNDSCAPES.RAIN: {
          const pinkBuffer = AudioService.createPinkNoiseBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_3SEC
          );
          const source = ctx.createBufferSource();
          source.buffer = pinkBuffer;
          source.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.RAIN_LOWPASS_FREQ;

          source.connect(filter);
          filter.connect(AudioService.masterGain!);
          source.start();

          AudioService.activeSourceNodes.push(source, filter);
          break;
        }

        case SOUNDSCAPES.OCEAN: {
          const pinkBuffer = AudioService.createPinkNoiseBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_4SEC
          );
          const source = ctx.createBufferSource();
          source.buffer = pinkBuffer;
          source.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.OCEAN_LOWPASS_FREQ;

          const waveGain = ctx.createGain();
          waveGain.gain.value = 0.2;

          const waveLfo = ctx.createOscillator();
          const waveLfoGain = ctx.createGain();
          waveLfo.type = 'sine';
          waveLfo.frequency.value = 0.12;
          waveLfoGain.gain.value = 0.18;

          waveLfo.connect(waveLfoGain);
          waveLfoGain.connect(waveGain.gain);

          source.connect(filter);
          filter.connect(waveGain);
          waveGain.connect(AudioService.masterGain!);

          source.start();
          waveLfo.start();

          AudioService.activeSourceNodes.push(source, filter, waveGain, waveLfo, waveLfoGain);
          break;
        }

        case SOUNDSCAPES.FIREPLACE: {
          const pinkBuffer = AudioService.createPinkNoiseBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_3SEC
          );
          const crackleBuffer = AudioService.createCrackleBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_4SEC
          );

          const warmSource = ctx.createBufferSource();
          warmSource.buffer = pinkBuffer;
          warmSource.loop = true;

          const crackleSource = ctx.createBufferSource();
          crackleSource.buffer = crackleBuffer;
          crackleSource.loop = true;

          const warmFilter = ctx.createBiquadFilter();
          warmFilter.type = 'lowpass';
          warmFilter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.FIREPLACE_LOWPASS_FREQ;

          const crackleFilter = ctx.createBiquadFilter();
          crackleFilter.type = 'highpass';
          crackleFilter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.FIREPLACE_HIGHPASS_FREQ;

          const fireBus = ctx.createGain();
          fireBus.gain.value = 0.4;

          warmSource.connect(warmFilter);
          warmFilter.connect(fireBus);
          crackleSource.connect(crackleFilter);
          crackleFilter.connect(fireBus);
          fireBus.connect(AudioService.masterGain!);

          warmSource.start();
          crackleSource.start();

          AudioService.activeSourceNodes.push(
            warmSource, crackleSource, warmFilter, crackleFilter, fireBus
          );
          break;
        }

        case SOUNDSCAPES.BREEZE: {
          const pinkBuffer = AudioService.createPinkNoiseBuffer(
            ctx,
            AUDIO_SYNTHESIS_CONSTANTS.SAMPLE_RATE_BUFFER_4SEC
          );
          const source = ctx.createBufferSource();
          source.buffer = pinkBuffer;
          source.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.BREEZE_BANDPASS_FREQ;
          filter.Q.value = 1.2;

          const windLfo = ctx.createOscillator();
          const windLfoGain = ctx.createGain();
          windLfo.type = 'sine';
          windLfo.frequency.value = 0.08;
          windLfoGain.gain.value = 250;

          windLfo.connect(windLfoGain);
          windLfoGain.connect(filter.frequency);

          source.connect(filter);
          filter.connect(AudioService.masterGain!);
          source.start();
          windLfo.start();

          AudioService.activeSourceNodes.push(source, filter, windLfo, windLfoGain);
          break;
        }

        case SOUNDSCAPES.COSMIC: {
          const baseOsc = ctx.createOscillator();
          const thetaOsc = ctx.createOscillator();

          baseOsc.type = 'sine';
          baseOsc.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.COSMIC_SOLFEGGIO_FREQ;

          thetaOsc.type = 'sine';
          thetaOsc.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.COSMIC_THETA_FREQ;

          const droneGain = ctx.createGain();
          droneGain.gain.value = 0.15;

          baseOsc.connect(droneGain);
          thetaOsc.connect(droneGain);
          droneGain.connect(AudioService.masterGain!);

          baseOsc.start();
          thetaOsc.start();

          AudioService.activeSourceNodes.push(baseOsc, thetaOsc, droneGain);
          break;
        }

        case SOUNDSCAPES.ALPHA: {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();

          osc1.type = 'sine';
          osc1.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.ALPHA_BASE_FREQ;

          osc2.type = 'sine';
          osc2.frequency.value = AUDIO_SYNTHESIS_CONSTANTS.ALPHA_BEAT_FREQ;

          const alphaGain = ctx.createGain();
          alphaGain.gain.value = 0.18;

          osc1.connect(alphaGain);
          osc2.connect(alphaGain);
          alphaGain.connect(AudioService.masterGain!);

          osc1.start();
          osc2.start();

          AudioService.activeSourceNodes.push(osc1, osc2, alphaGain);
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.warn('[AudioService Web] Soundscape synthesis error:', error);
    }
  }

  /** Stop active ambient audio */
  static stopSoundscape(): void {
    const hasCustomAudio = Boolean(AudioService.customAudioElement);
    if (hasCustomAudio && AudioService.customAudioElement) {
      try {
        AudioService.customAudioElement.pause();
        AudioService.customAudioElement.currentTime = 0;
      } catch {
        // Ignore pause errors
      }
      AudioService.customAudioElement = null;
    }
    AudioService.activeSourceNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    });
    AudioService.activeSourceNodes = [];
    AudioService.currentSoundscape = SOUNDSCAPES.OFF;
  }

  /** Get active soundscape */
  static getCurrentSoundscape(): SoundscapeType {
    return AudioService.currentSoundscape;
  }
}
