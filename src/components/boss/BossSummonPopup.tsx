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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none">
      <div className="animate-bounce rounded-lg border-2 border-yellow-500 bg-gradient-to-b from-yellow-600 to-yellow-700 px-8 py-6 shadow-2xl text-center pointer-events-auto">
        <p className="mb-2 text-2xl font-bold text-white">⚡ Il boss si è fatto avanti! ⚡</p>
        <h1 className="mb-3 text-4xl font-black text-yellow-100">
          🐉 {bossName.toUpperCase()}
        </h1>
        <p className="text-xl text-yellow-100">
          {rarityEmoji[bossRarity] || '⭐'}
        </p>
        <p className="mt-4 text-xs text-yellow-900 animate-pulse">
          (Tutte le gilde combattono lo stesso boss!)
        </p>
      </div>
    </div>
  );
};
