import React, { useEffect } from 'react';

interface BossSummonPopupProps {
  bossName: string;
  bossRarity: number;
  onClose: () => void;
}

export const BossSummonPopup: React.FC<BossSummonPopupProps> = ({
  bossName,
  bossRarity,
  onClose,
}) => {
  const rarityEmoji = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

  // Auto-close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-none">
      <div className="animate-bounce rounded-lg border-2 border-amber-600 bg-gradient-to-b from-amber-700 to-amber-800 px-6 py-4 shadow-xl text-center pointer-events-auto max-w-sm">
        <p className="mb-1 text-lg font-bold text-amber-100">⚡ Il boss si è fatto avanti! ⚡</p>
        <h1 className="mb-2 text-2xl font-black text-amber-200">
          🐉 {bossName.toUpperCase()}
        </h1>
        <p className="text-lg text-amber-200">
          {rarityEmoji[bossRarity] || '⭐'}
        </p>
        <p className="mt-3 text-xs text-amber-300/70 animate-pulse">
          Tutte le gilde combattono lo stesso boss!
        </p>
      </div>
    </div>
  );
};
