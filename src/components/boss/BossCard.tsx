import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { useI18n } from '@/i18n';

interface Boss {
  boss_key: string;
  boss_rarity: number;
  max_hp: number;
  current_hp: number;
  total_damage: number;
  is_defeated: boolean;
}

interface BossCardProps {
  guildId: string;
  boss?: Boss;
  isLoading?: boolean;
  onAttackClick?: () => void;
  isBossWeekend?: boolean;
  currentUserRole?: 'leader' | 'royal_knight' | 'wizard' | 'member';
}

/**
 * BossCard
 *
 * Displays:
 * - Boss name + rarity (stars)
 * - Health bar (current_hp / max_hp)
 * - Total damage dealt by guild
 * - Members who attacked (count)
 * - Attack button (if weekend + not defeated)
 * - Victory state (if defeated)
 */
export const BossCard: React.FC<BossCardProps> = ({
  guildId,
  boss,
  isLoading = false,
  onAttackClick,
  isBossWeekend = true,
  currentUserRole = 'member',
}) => {
  const { t } = useI18n();
  const [healthPercent, setHealthPercent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update health bar animation
  useEffect(() => {
    if (boss) {
      const percent = Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100));
      setHealthPercent(percent);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [boss?.current_hp, boss?.max_hp]);

  if (!boss) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">{t('no_active_boss')}</p>
      </div>
    );
  }

  const bossNameMap: Record<string, string> = {
    drago_bianco: 'White Dragon',
    drago_nero: 'Black Dragon',
    drago_rosso: 'Red Dragon',
    drago_verde: 'Green Dragon',
    drago_comune: 'Common Dragon',
    kraken: 'Kraken',
    leviatano: 'Leviathan',
    idra: 'Hydra',
    fenice: 'Phoenix',
    basilisco: 'Basilisk',
    gigante: 'Giant',
    grifone: 'Griffin',
    ippogrifo: 'Hippogriff',
    lupo_mannaro: 'Werewolf',
    minotauro: 'Minotaur',
    gnomo: 'Gnome',
    goblin: 'Goblin',
    fata: 'Fairy',
  };

  const bossName = bossNameMap[boss.boss_key] || boss.boss_key;
  const stars = '⭐'.repeat(boss.boss_rarity);
  const isDefeated = boss.is_defeated;
  const canAttack = isBossWeekend && !isDefeated;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-600 rounded-lg p-6 shadow-xl">
      {/* Header: Boss Name + Rarity */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-300">{bossName}</h2>
          <p className="text-yellow-400 text-sm">{stars}</p>
        </div>
        {isDefeated && (
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            ✓ DEFEATED
          </div>
        )}
      </div>

      {/* Health Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Health</span>
          <span className="text-purple-300 font-mono">
            {Math.max(0, boss.current_hp)} / {boss.max_hp}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden border border-gray-600">
          <div
            className={`h-full transition-all duration-500 ${
              isAnimating ? 'bg-red-500' : 'bg-purple-600'
            }`}
            style={{
              width: `${healthPercent}%`,
            }}
          />
        </div>
      </div>

      {/* Stats: Damage + Guild Contribution */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700 rounded p-3">
          <p className="text-gray-400 text-xs">Total Damage</p>
          <p className="text-white font-bold text-lg">{boss.total_damage}</p>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <p className="text-gray-400 text-xs">HP Remaining</p>
          <p className="text-white font-bold text-lg">{Math.max(0, boss.current_hp)}</p>
        </div>
      </div>

      {/* Role Info (if applicable) */}
      {currentUserRole && currentUserRole !== 'member' && (
        <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded p-2 mb-4 text-xs text-blue-300">
          <p>Role Bonus: {currentUserRole}</p>
        </div>
      )}

      {/* Action Button */}
      {canAttack ? (
        <Button
          onClick={onAttackClick}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
        >
          {isLoading ? 'Attacking...' : 'Attack Boss'}
        </Button>
      ) : isDefeated ? (
        <div className="w-full bg-green-600 text-white text-center py-2 rounded font-bold">
          Boss Defeated! Check rewards.
        </div>
      ) : (
        <div className="w-full bg-gray-600 text-gray-300 text-center py-2 rounded font-bold">
          Boss fights only available on weekends
        </div>
      )}

      {/* Footer: Rarity Info */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
        <p>Rarity Level: {boss.boss_rarity}/5</p>
        <p>Guild XP Reward: {boss.boss_rarity * 75}</p>
      </div>
    </div>
  );
};

export default BossCard;
