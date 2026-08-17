// Convert raw 16-bit PCM audio data to a WAV Blob
// ElevenLabs returns raw PCM via output_format=pcm_44100
export const pcmToWav = (pcmData, sampleRate = 44100, numChannels = 1) => {
  const dataLength = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Copy PCM data
  new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));

  return new Blob([buffer], { type: 'audio/wav' });
};