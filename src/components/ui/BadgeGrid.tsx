'use client';

import { BADGE_DEFINITIONS } from '@/lib/badges';

interface BadgeGridProps {
  earnedIndexes: number[];
  size?: 'sm' | 'md';
}

export default function BadgeGrid({ earnedIndexes, size = 'md' }: BadgeGridProps) {
  const dim = size === 'sm' ? '32px' : '48px';

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {BADGE_DEFINITIONS.map((badge) => {
        const earned = earnedIndexes.includes(badge.index);
        const col = badge.index % 3;
        const row = Math.floor(badge.index / 3);
        const bgPosX = `${col * 50}%`;
        const bgPosY = `${row * 33.33}%`;

        return (
          <div
            key={badge.index}
            title={badge.name}
            style={{
              width: dim,
              height: dim,
              backgroundImage: "url('/images/badges-nobg.png')",
              backgroundSize: '300% 400%',
              backgroundPosition: `${bgPosX} ${bgPosY}`,
              backgroundRepeat: 'no-repeat',
              filter: earned ? 'none' : 'grayscale(100%)',
              opacity: earned ? 1 : 0.3,
              boxShadow: earned
                ? '0 0 8px rgba(217,119,6,0.5)'
                : 'none',
            }}
            className={
              earned
                ? 'dark:[box-shadow:0_0_8px_rgba(99,102,241,0.5)]'
                : ''
            }
          />
        );
      })}
    </div>
  );
}
