'use client';

import { useEffect, useState, useRef } from 'react';
import type { Judge, Score } from '@/lib/firestore';
import styles from './JudgeCard.module.css';

interface Props {
  judge: Judge;
  score: Score | undefined;
  index: number;
}

function useCountUp(target: number | null, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) { setDisplay(0); return; }
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(target! * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

// Split "Anh Nguyễn Bình Minh" → prefix="Anh" + boldName="Nguyễn Bình Minh"
function splitName(fullName: string): { prefix: string; rest: string } {
  const prefixes = ['Anh', 'Chị', 'Ông', 'Bà'];
  for (const p of prefixes) {
    if (fullName.startsWith(p + ' ')) {
      return { prefix: p, rest: fullName.slice(p.length + 1) };
    }
  }
  return { prefix: '', rest: fullName };
}

export default function JudgeCard({ judge, score, index }: Props) {
  const hasScore = score !== undefined;
  const displayScore = useCountUp(hasScore ? score.score : null);
  const [revealed, setRevealed] = useState(false);
  const { prefix, rest } = splitName(judge.name);

  useEffect(() => {
    if (hasScore && !revealed) {
      const t = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(t);
    }
    if (!hasScore) setRevealed(false);
  }, [hasScore, revealed]);

  return (
    <div
      className={`${styles.card} ${revealed ? styles.revealed : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Portrait photo */}
      <div className={styles.photoWrap}>
        {judge.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={judge.avatar} alt={judge.name} className={styles.photo} />
        ) : (
          <div className={styles.photoFallback}>
            <span className={styles.photoInitial}>{judge.name.charAt(0)}</span>
          </div>
        )}

        {/* Red vignette overlay */}
        <div className={styles.vignette} />

        {/* Score badge — floats top-right when scored */}
        {hasScore && (
          <div className={`${styles.scoreBadge} ${revealed ? styles.scoreBadgeReveal : ''}`}>
            <span className={styles.scoreBadgeValue}>{displayScore}</span>
            <span className={styles.scoreBadgeUnit}>/50</span>
            <div className={styles.checkBadge}>✓</div>
          </div>
        )}

        {/* Pending dots — shown when waiting */}
        {!hasScore && (
          <div className={styles.pendingOverlay}>
            <div className={styles.pendingDots}>
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Name bar at bottom */}
      <div className={styles.nameBar}>
        {prefix && <span className={styles.namePrefix}>{prefix}</span>}
        <span className={styles.nameBold}>{rest}</span>
      </div>
    </div>
  );
}
