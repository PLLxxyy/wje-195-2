import React, { useState, useEffect, useRef } from 'react';
import { WheelOption } from '../types';

interface Props {
  options: WheelOption[];
  spinning: boolean;
  onResult: (text: string, color: string) => void;
}

export default function DrawTube({ options, spinning, onResult }: Props) {
  const [shaking, setShaking] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [sticks, setSticks] = useState<{ color: string; rotation: number }[]>([]);
  const timerRef = useRef<number>(0);

  // Generate random stick positions
  useEffect(() => {
    const newSticks = options.map((opt) => ({
      color: opt.color,
      rotation: (Math.random() - 0.5) * 20,
    }));
    setSticks(newSticks);
    setWinnerIdx(null);
  }, [options]);

  useEffect(() => {
    if (!spinning) return;

    setShaking(true);
    setWinnerIdx(null);

    // Shake for 1.5s, then reveal
    const shakeTimer = setTimeout(() => {
      setShaking(false);

      // Pick random winner
      const winIdx = Math.floor(Math.random() * options.length);
      setWinnerIdx(winIdx);

      timerRef.current = window.setTimeout(() => {
        onResult(options[winIdx].text, options[winIdx].color);
      }, 600);
    }, 1500);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(timerRef.current);
    };
  }, [spinning]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`tube-container ${shaking ? 'tube-shake' : ''}`}>
      <div className="tube-body">
        <div className="tube-band tube-band-top" />
        <div className="tube-sticks">
          {sticks.map((stick, i) => (
            <div
              key={i}
              className={`tube-stick ${winnerIdx === i ? 'winner' : ''}`}
              style={{
                background: `linear-gradient(180deg, ${stick.color}, ${darkenColor(stick.color, 40)})`,
                transform: `rotate(${stick.rotation}deg)`,
                ...(winnerIdx === i
                  ? {
                      height: '65px',
                      width: '10px',
                      background: `linear-gradient(180deg, #FFD700, #FFA500)`,
                    }
                  : {}),
              }}
            >
              {/* Stick tip */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: `8px solid ${winnerIdx === i ? '#FFD700' : stick.color}`,
                }}
              />
              {/* Winner label */}
              {winnerIdx === i && (
                <div
                  style={{
                    position: 'absolute',
                    top: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    color: '#FFD700',
                    fontSize: 14,
                    fontWeight: 700,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {options[i].text}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="tube-band tube-band-bottom" />
      </div>
    </div>
  );
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}
