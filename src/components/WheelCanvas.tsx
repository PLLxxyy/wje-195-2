import React, { useRef, useEffect, useCallback, useState } from 'react';
import { WheelOption } from '../types';
import { weightedRandomIndex } from '../storage';

interface Props {
  options: WheelOption[];
  spinning: boolean;
  onResult: (text: string, color: string) => void;
  highlightOptionId: string | null;
}

export default function WheelCanvas({ options, spinning, onResult, highlightOptionId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const [size, setSize] = useState(400);

  const totalWeight = options.reduce((sum, o) => sum + Math.max(0, o.weight), 0);

  const getSliceAngles = useCallback(() => {
    const angles: { start: number; end: number; center: number }[] = [];
    if (totalWeight <= 0 || options.length === 0) return angles;
    let accumulated = 0;
    for (const opt of options) {
      const w = Math.max(0, opt.weight);
      const sliceAngle = (w / totalWeight) * Math.PI * 2;
      const start = accumulated - Math.PI / 2;
      const end = start + sliceAngle;
      const center = start + sliceAngle / 2;
      angles.push({ start, end, center });
      accumulated += sliceAngle;
    }
    return angles;
  }, [options, totalWeight]);

  // Responsive size
  useEffect(() => {
    const update = () => {
      setSize(window.innerWidth <= 860 ? 320 : 400);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Draw wheel
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const count = options.length;
    const sliceAngles = getSliceAngles();

    ctx.clearRect(0, 0, size, size);

    // Draw outer glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
    ctx.lineWidth = 8;
    ctx.shadowColor = 'rgba(233, 69, 96, 0.4)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    if (count === 0 || totalWeight <= 0) {
      ctx.fillStyle = '#2a3a5c';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a7a8c';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('请添加选项', cx, cy);
      return;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    for (let i = 0; i < count; i++) {
      const opt = options[i];
      const angles = sliceAngles[i];
      if (!angles) continue;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angles.start, angles.end);
      ctx.closePath();

      // Gradient fill
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      grad.addColorStop(0, lightenColor(opt.color, 30));
      grad.addColorStop(1, opt.color);
      ctx.fillStyle = grad;
      ctx.fill();

      // Slice border
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw text
      ctx.save();
      const textAngle = angles.center;
      ctx.rotate(textAngle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      const textRadius = radius * 0.6;
      const maxTextWidth = radius * 0.45;

      // Adjust font size based on text length and slice size
      const sliceAngle = angles.end - angles.start;
      const baseFontSize = sliceAngle > 0.8 ? 15 : sliceAngle > 0.5 ? 13 : 11;
      ctx.font = `bold ${baseFontSize}px sans-serif`;

      ctx.fillText(opt.text, textRadius, 0, maxTextWidth);
      ctx.restore();
    }

    // Center circle
    const centerRadius = radius * 0.12;
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius);
    centerGrad.addColorStop(0, '#fff');
    centerGrad.addColorStop(0.5, '#e0e0e0');
    centerGrad.addColorStop(1, '#c0c0c0');
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Decorative inner ring
    ctx.beginPath();
    ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Highlight arc for result
    if (highlightOptionId && !spinning) {
      const opt = options.find(o => o.id === highlightOptionId);
      if (opt) {
        const idx = options.indexOf(opt);
        const angles = sliceAngles[idx];
        if (angles) {
          const highlightStart = angles.start + rotation;
          const highlightEnd = angles.end + rotation;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.beginPath();
          ctx.arc(0, 0, radius + 2, highlightStart, highlightEnd);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fillStyle = 'rgba(245, 166, 35, 0.15)';
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }, [options, size, highlightOptionId, spinning, getSliceAngles, totalWeight]);

  // Animate spinning
  useEffect(() => {
    if (!spinning) {
      drawWheel(angleRef.current);
      return;
    }

    // First determine result by weight
    const resultIndex = weightedRandomIndex(options);
    const sliceAngles = getSliceAngles();
    const targetCenterAngle = sliceAngles[resultIndex]?.center || 0;

    // We want the pointer (at top, -PI/2) to point at the center of the target slice
    // After rotation R, slice center angle (relative to -PI/2) becomes: center + R
    // We want pointer to point at it, so: center + R ≡ -PI/2 (mod 2PI)
    // => R ≡ -PI/2 - center (mod 2PI)
    // Actually, let's think again:
    // - Pointer is at top direction (12 o'clock)
    // - We rotate the wheel by `rotation` radians
    // - A slice at original angle `center` will be at angle `center + rotation` after rotation
    // - We want the slice center to be at the top (-PI/2 in canvas coords)
    // - So: center + rotation = -PI/2 + 2PI * k
    // - rotation = -PI/2 - center + 2PI * k
    const targetRotation = -Math.PI / 2 - targetCenterAngle;

    // Add extra spins
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = targetRotation + Math.PI * 2 * extraSpins;

    // Normalize start angle
    const startAngle = angleRef.current % (Math.PI * 2);
    const totalRotation = finalAngle - startAngle + Math.PI * 2 * 2;

    // Animation with easing
    const duration = 4000 + Math.random() * 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentAngle = startAngle + totalRotation * eased;
      angleRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        angleRef.current = finalAngle;
        drawWheel(finalAngle);
        onResult(options[resultIndex].text, options[resultIndex].color);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [spinning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw when options or highlight change (not spinning)
  useEffect(() => {
    if (!spinning) {
      drawWheel(angleRef.current);
    }
  }, [options, highlightOptionId, drawWheel, spinning]);

  return (
    <div className="canvas-wrapper" style={{ width: size, height: size }}>
      <div className="pointer-indicator" />
      <canvas ref={canvasRef} />
    </div>
  );
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
