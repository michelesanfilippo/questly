'use client';

import Image from 'next/image';
import { BADGE_DEFINITIONS, getBadgeImagePath } from '@/lib/badges';

interface BadgeGridProps {
  earnedIndexes: number[];
  size?: 'sm' | 'md';
}

export function BadgeGrid({ earnedIndexes, size = 'md' }: BadgeGridProps) {
  const dim = size === 'sm' ? 32 : 48;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {BADGE_DEFINITIONS.map((badge) => {
        const earned = earnedIndexes.includes(badge.index);
        if (!earned) return null;
        return (
          <div
            key={badge.index}
            title={badge.name}
            style={{ width: dim, height: dim }}
          >
            <Image
              src={getBadgeImagePath(badge.index)}
              alt={badge.name}
              width={dim}
              height={dim}
              style={{
                boxShadow: '0 0 8px rgba(217,119,6,0.5)',
                borderRadius: '50%',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

