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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none backdrop-blur-sm">
      <div className="animate-bounce rounded-lg border-4 border-amber-900 bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-100 px-8 py-6 shadow-2xl text-center pointer-events-auto max-w-md relative overflow-hidden">
        {/* Parchment texture overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none rounded-lg" 
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' fill=\'%238b7355\' filter=\'url(%23noise)\' opacity=\'0.3\'/%3E%3C/svg%3E")',
            backgroundSize: '100px 100px'
          }}
        />
        
        <div className="relative z-10">
          <p className="mb-2 text-base font-bold text-amber-900">⚡ Il boss si è fatto avanti! ⚡</p>
          <h1 className="mb-3 text-3xl font-black text-amber-900 drop-shadow-lg">
            🐉 {bossName?.toUpperCase() || 'MYSTERIOUS BEAST'}
          </h1>
          <p className="text-2xl text-amber-800 font-bold">
            {rarityEmoji[bossRarity] || '⭐'}
          </p>
          <div className="mt-4 border-t-2 border-amber-900 pt-3">
            <p className="text-sm text-amber-800 font-semibold italic">
              Tutte le gilde combattono lo stesso boss!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
