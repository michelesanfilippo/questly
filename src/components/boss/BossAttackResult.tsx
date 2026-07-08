import React from 'react';

interface AttackResultProps {
  bossName: string;
  bossRarity: number;
  maxHp: number;
  currentHp: number;
  damageDealt: number;
  totalDamage: number;
  userScore: number;
  onClose: () => void;
}

export const BossAttackResult: React.FC<AttackResultProps> = ({
  bossName,
  bossRarity,
  maxHp,
  currentHp,
  damageDealt,
  totalDamage,
  userScore,
  onClose,
}) => {
  const rarityEmoji = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
  const hpPercent = (currentHp / maxHp) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border-2 border-amber-700 bg-gradient-to-b from-gray-900 to-gray-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-amber-700/30 pb-4">
          <h2 className="text-2xl font-bold text-amber-100">Risultato Attacco</h2>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300"
          >
            ✕
          </button>
        </div>

        {/* Boss Info */}
        <div className="mb-6 rounded-lg bg-gray-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-amber-100">🐉 {bossName.toUpperCase()}</h3>
              <p className="text-amber-400 text-sm">{rarityEmoji[bossRarity] || '⭐'}</p>
            </div>
          </div>

          {/* HP Bar */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-amber-200">HP Remainente:</span>
              <span className="text-amber-100 font-semibold">
                {currentHp} / {maxHp}
              </span>
            </div>
            <div className="h-6 w-full rounded-lg border border-amber-700 bg-gray-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {Math.round(hpPercent)}% HP remaining
            </p>
          </div>
        </div>

        {/* Attack Details */}
        <div className="mb-6 space-y-4 rounded-lg bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-amber-200">Danno Inflitto:</span>
            <span className="text-xl font-bold text-amber-100">+{damageDealt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-200">Danno Totale:</span>
            <span className="text-lg font-semibold text-amber-100">{totalDamage}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-200">Valutazione Risposta:</span>
            <span className="text-lg font-bold text-amber-300">{userScore}%</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600"
          >
            Continua
          </button>
        </div>
      </div>
    </div>
  );
};
