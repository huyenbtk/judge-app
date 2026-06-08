'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './Fireworks.module.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  radius: number;
  gravity: number;
  decay: number;
}

const COLORS = [
  '#ffd700', '#ff6b9d', '#BB0016', '#ffffff',
  '#ff4444', '#ffaa00', '#ff69b4', '#ffa500',
];

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const createBurst = useCallback((x: number, y: number) => {
    const count = 80 + Math.random() * 40;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        radius: 2 + Math.random() * 3,
        gravity: 0.08 + Math.random() * 0.04,
        decay: 0.012 + Math.random() * 0.008,
      });
    }
  }, []);

  const launchRandom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const x = 100 + Math.random() * (canvas.width - 200);
    const y = 80 + Math.random() * (canvas.height * 0.5);
    createBurst(x, y);
  }, [createBurst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Launch fireworks at intervals
    const launches: ReturnType<typeof setInterval>[] = [];
    // Rapid burst at start
    let count = 0;
    const rapid = setInterval(() => {
      launchRandom();
      count++;
      if (count >= 6) clearInterval(rapid);
    }, 300);
    launches.push(rapid);

    // Ongoing fireworks
    const ongoing = setInterval(() => {
      launchRandom();
    }, 800);
    launches.push(ongoing);

    // Animate
    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(41, 23, 21, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      launches.forEach(clearInterval);
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [launchRandom]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
