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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none">
      <div className="animate-bounce rounded-lg border-2 border-amber-700 bg-amber-900 px-8 py-6 shadow-2xl text-center pointer-events-auto max-w-md relative">
        <div className="relative z-10">
          <p className="mb-3 text-sm font-bold text-amber-200 uppercase tracking-wider">Il boss si è fatto avanti!</p>
          <h1 className="mb-4 text-2xl font-bold text-amber-100">
            {bossName?.toUpperCase() || 'MYSTERIOUS BEAST'}
          </h1>
          <div className="flex justify-center text-xl text-amber-300 font-bold mb-3">
            {rarityEmoji[bossRarity] || ''}
          </div>
          <p className="text-xs text-amber-300 font-semibold">
            Tutte le gilde combattono lo stesso boss!
          </p>
        </div>
      </div>
    </div>
  );
};
