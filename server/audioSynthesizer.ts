import fs from 'fs';
import path from 'path';

interface AudioGenerationParams {
  durationSeconds: number; // e.g. 30, 60
  bpm?: number; // e.g. 120
  style?: string; // 'Sad' | 'Romantic' | 'Lofi' | 'Pop' | 'Rap' | 'Hip-Hop' | 'Bollywood-inspired' | 'Devotional' | 'EDM' | 'Acoustic' | 'Cinematic'
  mood?: string;
  seedTitle?: string;
  vocalStartDelaySeconds?: number;
}

export function generateWavFile(params: AudioGenerationParams, outputPath: string): Promise<string> {
  return synthesizeMusicTrack(params, null, outputPath);
}

/**
 * Mix vocal WAV buffer with full multi-instrument backing music track.
 * This guarantees exact vocal words are sung over rich studio accompaniment.
 */
export function mixVocalsWithAccompaniment(
  vocalWavBuffer: Buffer,
  params: AudioGenerationParams,
  outputPath: string
): Promise<string> {
  return synthesizeMusicTrack(params, vocalWavBuffer, outputPath);
}

function synthesizeMusicTrack(
  params: AudioGenerationParams,
  vocalWavBuffer: Buffer | null,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const sampleRate = 24000;
      const numChannels = 2; // Stereo
      const bitsPerSample = 16;
      const bpm = params.bpm || getBpmForStyle(params.style);
      const beatDuration = 60 / bpm; // seconds per beat

      // Extract vocal PCM samples if vocal buffer provided
      let vocalPcmSamples: Int16Array | null = null;
      let vocalDurationSeconds = 0;

      if (vocalWavBuffer && vocalWavBuffer.length > 44) {
        // Find "data" chunk in RIFF WAV
        let dataOffset = 44;
        const dataChunkIndex = vocalWavBuffer.indexOf('data');
        if (dataChunkIndex !== -1 && dataChunkIndex + 8 <= vocalWavBuffer.length) {
          dataOffset = dataChunkIndex + 8;
        }

        const rawDataLength = vocalWavBuffer.length - dataOffset;
        const sampleCount = Math.floor(rawDataLength / 2);
        vocalPcmSamples = new Int16Array(sampleCount);

        for (let s = 0; s < sampleCount; s++) {
          vocalPcmSamples[s] = vocalWavBuffer.readInt16LE(dataOffset + s * 2);
        }

        vocalDurationSeconds = sampleCount / sampleRate;
      }

      // Compute total duration: ensure whole vocal is sung plus intro and outro bars
      const introDelaySeconds = vocalPcmSamples ? (params.vocalStartDelaySeconds || 1.2) : 0;
      const requestedDuration = Math.max(10, Math.min(180, params.durationSeconds || 30));
      const neededDuration = vocalPcmSamples
        ? Math.max(requestedDuration, Math.ceil(introDelaySeconds + vocalDurationSeconds + 2.5))
        : requestedDuration;

      const duration = Math.min(180, neededDuration);
      const totalSamples = sampleRate * duration;
      const vocalStartSample = Math.floor(introDelaySeconds * sampleRate);

      // Musical scales based on style/mood
      const scaleFrequencies = getScaleForStyle(params.style, params.mood);

      // Create PCM data buffer (16-bit stereo = 4 bytes per sample)
      const dataSize = totalSamples * numChannels * (bitsPerSample / 8);
      const buffer = Buffer.alloc(44 + dataSize);

      // Write WAV Header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + dataSize, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20); // PCM
      buffer.writeUInt16LE(numChannels, 22); // Stereo
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
      buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
      buffer.writeUInt16LE(bitsPerSample, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(dataSize, 40);

      // Synthesize multi-track music (Drums + Bass + Chord Pad + Melodic flourishes)
      const chordProgression = [
        [scaleFrequencies[0], scaleFrequencies[2], scaleFrequencies[4]],
        [scaleFrequencies[3], scaleFrequencies[5], scaleFrequencies[0] * 2],
        [scaleFrequencies[5], scaleFrequencies[0] * 2, scaleFrequencies[2] * 2],
        [scaleFrequencies[4], scaleFrequencies[6], scaleFrequencies[1] * 2],
      ];

      let offset = 44;
      const styleStr = (params.style || '').toLowerCase();
      const isLofi = styleStr.includes('lofi');
      const isAcoustic = styleStr.includes('acoustic');
      const isEDM = styleStr.includes('edm');
      const isRap = styleStr.includes('rap') || styleStr.includes('hip-hop');
      const isBollywood = styleStr.includes('bollywood') || styleStr.includes('devotional') || styleStr.includes('romantic');

      for (let i = 0; i < totalSamples; i++) {
        const time = i / sampleRate;
        const barIndex = Math.floor(time / (beatDuration * 4)) % 4;
        const currentChord = chordProgression[barIndex];

        // 1. Kick Drum
        let kick = 0;
        const kickInterval = isEDM ? 1 : 2;
        const timeSinceKick = time % (beatDuration * kickInterval);
        if (timeSinceKick < 0.2) {
          const kickFreq = 120 * Math.exp(-timeSinceKick * 24);
          kick = Math.sin(2 * Math.PI * kickFreq * timeSinceKick) * Math.exp(-timeSinceKick * 16) * 0.38;
        }

        // 2. Snare / Clack
        let snare = 0;
        const timeSinceSnare = (time % (beatDuration * 2)) - beatDuration;
        if (timeSinceSnare >= 0 && timeSinceSnare < 0.22) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-timeSinceSnare * 20);
          const tone = Math.sin(2 * Math.PI * 180 * timeSinceSnare) * Math.exp(-timeSinceSnare * 25);
          snare = (noise * 0.22 + tone * 0.12) * 0.35;
        }

        // 3. Hi-Hat
        let hihat = 0;
        const hatInterval = isRap ? 0.25 : 0.5;
        const timeSinceHat = time % (beatDuration * hatInterval);
        if (timeSinceHat < 0.08) {
          const hatNoise = (Math.random() * 2 - 1) * Math.exp(-timeSinceHat * 65);
          hihat = hatNoise * (isLofi ? 0.06 : 0.12);
        }

        // 4. Bass Line (Sub bass following chord root)
        const rootFreq = currentChord[0] / 2;
        let bass = Math.sin(2 * Math.PI * rootFreq * time) * 0.25;
        bass += Math.sin(2 * Math.PI * rootFreq * 2 * time) * 0.08;

        // 5. Chord Pad / Warm String Arpeggio
        let pad = 0;
        for (let c = 0; c < currentChord.length; c++) {
          const chordFreq = currentChord[c];
          pad += Math.sin(2 * Math.PI * chordFreq * time) * 0.06;
          pad += Math.sin(2 * Math.PI * (chordFreq * 1.003) * time) * 0.05;
        }

        // 6. Melodic flourish
        let lead = 0;
        // Keep melodic lead gentler when vocals are present so vocals stand out
        const leadVolume = vocalPcmSamples ? 0.06 : 0.16;
        const noteDuration = beatDuration / 2;
        const noteIndex = Math.floor(time / noteDuration) % scaleFrequencies.length;
        const leadFreq = scaleFrequencies[noteIndex] * (isBollywood ? 1.5 : 1.0);
        const timeInNote = time % noteDuration;
        const envelope = Math.sin((timeInNote / noteDuration) * Math.PI);
        lead = Math.sin(2 * Math.PI * leadFreq * time) * envelope * leadVolume;

        // Master Envelope
        const fadeIn = Math.min(1, time / 1.0);
        const fadeOut = Math.min(1, (duration - time) / 2.0);
        const masterEnv = fadeIn * Math.max(0, fadeOut);

        // Instrumental Bed
        const musicVolumeFactor = vocalPcmSamples ? 0.55 : 0.85;
        let leftSample = (kick * 0.8 + snare * 0.7 + hihat * 0.6 + bass * 0.75 + pad * 0.7 + lead * 0.8) * musicVolumeFactor * masterEnv;
        let rightSample = (kick * 0.8 + snare * 0.7 + hihat * 0.6 + bass * 0.75 + pad * 0.7 + lead * 0.75) * musicVolumeFactor * masterEnv;

        // 7. Mix in the Exact Vocal Audio
        if (vocalPcmSamples) {
          const vocalSampleIdx = i - vocalStartSample;
          if (vocalSampleIdx >= 0 && vocalSampleIdx < vocalPcmSamples.length) {
            // Normalize Int16 vocal sample (-1.0 to 1.0)
            const rawVocal = vocalPcmSamples[vocalSampleIdx] / 32768.0;
            // Vocal presence with gentle center boost
            const vocalGain = 1.15;
            leftSample += rawVocal * vocalGain;
            rightSample += rawVocal * vocalGain;
          }
        }

        // Stereo panning width
        leftSample += (pad * 0.08 - lead * 0.04);
        rightSample += (-pad * 0.08 + lead * 0.04);

        // Soft limiter / soft-clipper to prevent distortion
        leftSample = Math.tanh(leftSample);
        rightSample = Math.tanh(rightSample);

        // Convert to 16-bit PCM integer (-32768 to 32767)
        const leftInt = Math.floor(leftSample * 32767);
        const rightInt = Math.floor(rightSample * 32767);

        buffer.writeInt16LE(leftInt, offset);
        buffer.writeInt16LE(rightInt, offset + 2);
        offset += 4;
      }

      fs.writeFileSync(outputPath, buffer);
      resolve(outputPath);
    } catch (err) {
      reject(err);
    }
  });
}

function getBpmForStyle(style?: string): number {
  if (!style) return 100;
  const s = style.toLowerCase();
  if (s.includes('lofi')) return 80;
  if (s.includes('sad')) return 75;
  if (s.includes('romantic')) return 88;
  if (s.includes('acoustic')) return 95;
  if (s.includes('pop')) return 118;
  if (s.includes('rap') || s.includes('hip-hop')) return 92;
  if (s.includes('bollywood')) return 105;
  if (s.includes('edm')) return 128;
  if (s.includes('cinematic')) return 85;
  return 100;
}

function getScaleForStyle(style?: string, mood?: string): number[] {
  const s = (style || '').toLowerCase();
  const m = (mood || '').toLowerCase();

  if (s.includes('sad') || m.includes('sad') || m.includes('dark')) {
    return [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];
  }
  if (s.includes('bollywood') || s.includes('devotional') || s.includes('romantic')) {
    return [261.63, 277.18, 329.63, 349.23, 392.0, 415.3, 493.88];
  }
  if (s.includes('lofi') || s.includes('chill')) {
    return [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25];
  }
  if (s.includes('rap') || s.includes('hip-hop')) {
    return [174.61, 196.0, 207.65, 233.08, 261.63, 277.18, 311.13];
  }
  return [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
}
