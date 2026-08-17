import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCENT = '#FFED00';
const GRAY_OVERLAY = 'rgba(0, 0, 0, 0.55)';
const LOCATOR_FILL = 'rgba(255, 255, 255, 0.3)';
const LOCATOR_STROKE = 'rgba(255, 255, 255, 0.35)';
const TRI_SIZE = 8;
const HIT_WIDTH = 10;
const MIN_GAP = 0.02;

const drawWaveform = (canvas, audioBuffer, startRatio, endRatio, showLocators) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const data = audioBuffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.clearRect(0, 0, width, height);

  // Draw waveform bars
  ctx.fillStyle = ACCENT;
  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    const start = i * step;
    for (let j = 0; j < step; j++) {
      const datum = data[start + j] || 0;
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    const barHeight = Math.max(1, (max - min) * amp);
    ctx.fillRect(i, (1 + min) * amp, 1, barHeight);
  }

  if (!showLocators) return;

  const startX = startRatio * width;
  const endX = endRatio * width;

  // Gray out out-of-range areas
  ctx.fillStyle = GRAY_OVERLAY;
  if (startX > 0) ctx.fillRect(0, 0, startX, height);
  if (endX < width) ctx.fillRect(endX, 0, width - endX, height);

  // Transparent vertical lines
  ctx.strokeStyle = LOCATOR_STROKE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(startX, height);
  ctx.moveTo(endX, 0);
  ctx.lineTo(endX, height);
  ctx.stroke();

  // Transparent right triangles grounded at bottom — symmetric pair
  ctx.fillStyle = LOCATOR_FILL;
  // Start: right angle at bottom-left, hypotenuse slopes up-right
  ctx.beginPath();
  ctx.moveTo(startX, height);
  ctx.lineTo(startX, height - TRI_SIZE);
  ctx.lineTo(startX + TRI_SIZE, height);
  ctx.closePath();
  ctx.fill();
  // End: right angle at bottom-right, hypotenuse slopes up-left (mirror)
  ctx.beginPath();
  ctx.moveTo(endX, height);
  ctx.lineTo(endX, height - TRI_SIZE);
  ctx.lineTo(endX - TRI_SIZE, height);
  ctx.closePath();
  ctx.fill();
};

export default function WaveformPreview({ audioUrl, showLocators = false, onRangeChange }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const bufferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startRatio, setStartRatio] = useState(0);
  const [endRatio, setEndRatio] = useState(1);
  const draggingRef = useRef(null);
  const ratiosRef = useRef({ start: 0, end: 1 });

  // Decode audio and store buffer
  useEffect(() => {
    if (!audioUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset locators on new audio
    setStartRatio(0);
    setEndRatio(1);
    ratiosRef.current = { start: 0, end: 1 };

    let cancelled = false;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    fetch(audioUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then((audioBuffer) => {
        if (cancelled) return;
        bufferRef.current = audioBuffer;
        drawWaveform(canvas, audioBuffer, 0, 1, showLocators);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      audioCtx.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Redraw when ratios or showLocators change
  useEffect(() => {
    const canvas = canvasRef.current;
    const buffer = bufferRef.current;
    if (canvas && buffer) {
      drawWaveform(canvas, buffer, startRatio, endRatio, showLocators);
    }
  }, [startRatio, endRatio, showLocators]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = 0;
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePointerDown = (e) => {
    if (!showLocators) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startX = ratiosRef.current.start * rect.width;
    const endX = ratiosRef.current.end * rect.width;

    if (Math.abs(x - startX) <= HIT_WIDTH) {
      draggingRef.current = 'start';
      canvas.setPointerCapture(e.pointerId);
    } else if (Math.abs(x - endX) <= HIT_WIDTH) {
      draggingRef.current = 'end';
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    if (draggingRef.current === 'start') {
      const newStart = Math.min(ratio, ratiosRef.current.end - MIN_GAP);
      ratiosRef.current.start = newStart;
      setStartRatio(newStart);
    } else {
      const newEnd = Math.max(ratio, ratiosRef.current.start + MIN_GAP);
      ratiosRef.current.end = newEnd;
      setEndRatio(newEnd);
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    if (onRangeChange) {
      onRangeChange(ratiosRef.current.start, ratiosRef.current.end);
    }
  };

  return (
    <div className="flex items-center gap-2 h-8">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-accent hover:text-accent hover:bg-card-foreground/10"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <canvas
        ref={canvasRef}
        className={`flex-1 h-8 ${showLocators ? 'cursor-ew-resize touch-none' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}