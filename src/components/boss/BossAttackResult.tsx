import React from 'react';

interface AttackResultProps {
  bossName: string;
  bossRarity: number;
  maxHp: number;
  currentHp: number;
  damageDealt: number;
  totalDamage: number;
  userScore: number;
  feedback?: string;
  suggestions?: string[];
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
  feedback,
  suggestions,
  onClose,
}) => {
  const rarityEmoji = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
  const hpPercent = (currentHp / maxHp) * 100;
  
  // Determine score color
  const scoreColor = userScore >= 80 ? 'text-emerald-500' : userScore >= 60 ? 'text-amber-400' : userScore >= 40 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-4 border-amber-900 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-8 shadow-2xl relative">
        {/* Parchment texture overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none rounded-lg" 
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' fill=\'%238b7355\' filter=\'url(%23noise)\' opacity=\'0.3\'/%3E%3C/svg%3E")',
            backgroundSize: '100px 100px'
          }}
        />
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-amber-900 pb-4 relative z-10">
          <h2 className="text-3xl font-bold text-amber-900">Risultato Attacco</h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Score Display */}
        <div className="mb-8 text-center relative z-10">
          <div className="flex items-baseline justify-center gap-3">
            <span className={`text-5xl font-bold ${scoreColor}`}>{userScore}</span>
            <span className="text-amber-900 text-xl">/ 100</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-amber-800 uppercase tracking-wider">Valutazione Risposta</p>
        </div>

        {/* Boss Info */}
        <div className="mb-6 rounded-lg border-2 border-amber-900 bg-gradient-to-b from-amber-100 to-yellow-50 p-5 relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-amber-900">🐉 {bossName?.toUpperCase() || 'MYSTERIOUS BEAST'}</h3>
              <p className="text-amber-700 text-base font-semibold">{rarityEmoji[bossRarity] || '⭐'}</p>
            </div>
          </div>

          {/* HP Bar */}
          <div className="mb-2">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-amber-900 font-semibold">HP Rimasto:</span>
              <span className="text-amber-900 font-bold">
                {currentHp} / {maxHp}
              </span>
            </div>
            <div className="h-5 w-full rounded-full border-2 border-amber-900 bg-gray-300 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-amber-700 font-semibold">
              {Math.round(hpPercent)}% HP rimasto
            </p>
          </div>
        </div>

        {/* Attack Details */}
        <div className="mb-6 space-y-3 rounded-lg border-2 border-amber-900 bg-gradient-to-b from-yellow-100 to-amber-50 p-5 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-amber-900 font-semibold">Danno Inflitto:</span>
            <span className="text-2xl font-bold text-red-700">+{damageDealt}</span>
          </div>
          <div className="flex items-center justify-between border-t border-amber-700/30 pt-2">
            <span className="text-amber-900 font-semibold">Danno Totale:</span>
            <span className="text-xl font-bold text-amber-900">{totalDamage}</span>
          </div>
        </div>

        {/* Feedback & Suggestions */}
        {feedback && (
          <div className="mb-6 rounded-lg border-2 border-amber-900 bg-gradient-to-b from-yellow-50 to-amber-50 p-5 relative z-10">
            <p className="text-base text-amber-900 italic leading-relaxed border-l-4 border-amber-700 pl-4 font-serif">
              "{feedback}"
            </p>
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="mb-6 rounded-lg border-2 border-amber-900 bg-gradient-to-b from-yellow-50 to-amber-50 p-5 relative z-10">
            <p className="mb-3 text-sm font-bold text-amber-900 uppercase tracking-wider">✦ Suggerimenti ✦</p>
            <ul className="space-y-2">
              {suggestions.map((suggestion, i) => (
                <li key={i} className="flex gap-3 text-sm text-amber-900">
                  <span className="text-amber-700 flex-shrink-0 font-bold">•</span>
                  <span className="leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <div className="flex gap-3 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border-2 border-amber-900 bg-gradient-to-b from-amber-700 to-amber-800 px-4 py-3 font-bold text-amber-50 transition-all hover:from-amber-600 hover:to-amber-700 shadow-lg uppercase tracking-wider"
          >
            Continua
          </button>
        </div>
      </div>
    </div>
  );
};
