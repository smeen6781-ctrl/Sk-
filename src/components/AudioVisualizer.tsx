import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  colorScheme?: 'purple' | 'pink' | 'gradient';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  barCount = 32,
  height = 48,
  colorScheme = 'gradient',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount - 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);

        let amplitude = 0.15;
        if (isPlaying) {
          // Dynamic procedural harmonic waves
          const wave1 = Math.sin(phase + i * 0.25);
          const wave2 = Math.cos(phase * 1.5 + i * 0.4);
          const wave3 = Math.sin(phase * 0.8 + i * 0.1);
          amplitude = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
          amplitude = Math.max(0.12, Math.min(0.95, amplitude));
        }

        const barHeight = amplitude * (canvas.height * 0.85);
        const y = centerY - barHeight / 2;

        let fillStyle: string | CanvasGradient = '#a855f7';
        if (colorScheme === 'gradient') {
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#ec4899'); // Pink
          grad.addColorStop(0.5, '#a855f7'); // Purple
          grad.addColorStop(1, '#3b82f6'); // Blue
          fillStyle = grad;
        } else if (colorScheme === 'pink') {
          fillStyle = '#ec4899';
        }

        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, barCount, colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 8}
      height={height}
      className="w-full max-w-full rounded-lg"
    />
  );
};
