import React, { useRef, useEffect, useCallback, useState } from 'react';
import { WheelOption } from '../types';

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
  const velocityRef = useRef(0);
  const [size, setSize] = useState(400);

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

    if (count === 0) {
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

    const sliceAngle = (Math.PI * 2) / count;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    for (let i = 0; i < count; i++) {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      const opt = options[i];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
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
      const textAngle = startAngle + sliceAngle / 2;
      ctx.rotate(textAngle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      const textRadius = radius * 0.6;
      const maxTextWidth = radius * 0.45;

      // Adjust font size based on text length
      const baseFontSize = count <= 6 ? 15 : count <= 9 ? 13 : 11;
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
        const highlightAngle = idx * sliceAngle + rotation - Math.PI / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.arc(0, 0, radius + 2, highlightAngle, highlightAngle + sliceAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(245, 166, 35, 0.15)';
        ctx.fill();
        ctx.restore();
      }
    }
  }, [options, size, highlightOptionId, spinning]);

  // Animate spinning
  useEffect(() => {
    if (!spinning) {
      drawWheel(angleRef.current);
      return;
    }

    // Start spinning
    const initialVelocity = 0.3 + Math.random() * 0.15;
    velocityRef.current = initialVelocity;
    const friction = 0.992;
    const minVelocity = 0.001;

    const animate = () => {
      velocityRef.current *= friction;
      angleRef.current += velocityRef.current;

      // Normalize angle
      angleRef.current = angleRef.current % (Math.PI * 2);

      drawWheel(angleRef.current);

      if (velocityRef.current > minVelocity) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine result
        const count = options.length;
        if (count === 0) return;

        const sliceAngle = (Math.PI * 2) / count;
        // Pointer is at top (12 o'clock), which is -PI/2 in canvas coords
        // After rotation, the segment at top is determined by: (-angle) mod 2PI / sliceAngle
        let normalizedAngle = (-angleRef.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const resultIndex = Math.floor(normalizedAngle / sliceAngle) % count;
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
