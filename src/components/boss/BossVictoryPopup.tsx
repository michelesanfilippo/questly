import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BossVictoryPopupProps {
  isOpen: boolean;
  bossName: string;
  bossRarity: number;
  guildXP: number;
  userXP: number;
  totalDamage: number;
  userDamage: number;
  onClose: () => void;
  onClaimRewards?: () => void;
}

/**
 * BossVictoryPopup
 *
 * Displays celebratory popup when boss is defeated:
 * - Boss name + rarity
 * - Total guild XP earned
 * - User's personal XP earned
 * - Damage contribution stats
 * - "Claim Rewards" button
 * - Confetti animation (optional)
 */
export const BossVictoryPopup: React.FC<BossVictoryPopupProps> = ({
  isOpen,
  bossName,
  bossRarity,
  guildXP,
  userXP,
  totalDamage,
  userDamage,
  onClose,
  onClaimRewards,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const userDamagePercent = totalDamage > 0 ? Math.round((userDamage / totalDamage) * 100) : 0;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleClaimRewards = () => {
    onClaimRewards?.();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-gradient-to-br from-yellow-900 to-orange-900 border-4 border-yellow-400 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 ${
          isClosing ? 'scale-90' : 'scale-100'
        }`}
      >
        {/* Header: Victory Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">🎉 VICTORY! 🎉</h1>
          <p className="text-yellow-100 text-lg">{bossName}</p>
          <p className="text-yellow-400 font-bold">{'⭐'.repeat(bossRarity)}</p>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-yellow-400 my-4" />

        {/* XP Rewards */}
        <div className="space-y-4 mb-6">
          {/* Guild XP */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4 border border-yellow-600">
            <p className="text-yellow-300 text-sm font-bold">GUILD REWARD</p>
            <p className="text-yellow-100 text-2xl font-bold">{guildXP} XP</p>
          </div>

          {/* User XP */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4 border border-orange-600">
            <p className="text-orange-300 text-sm font-bold">YOUR REWARD</p>
            <p className="text-orange-100 text-2xl font-bold">{userXP} XP</p>
          </div>

          {/* Damage Stats */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4 border border-red-600">
            <p className="text-red-300 text-sm font-bold">YOUR CONTRIBUTION</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-red-100">
                {userDamage} / {totalDamage} damage
              </span>
              <span className="text-yellow-300 font-bold text-lg">{userDamagePercent}%</span>
            </div>
            {/* Damage bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{ width: `${userDamagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-yellow-400 my-4" />

        {/* Achievement Text */}
        <p className="text-center text-yellow-100 text-sm mb-6 leading-relaxed">
          Your guild banded together and defeated {bossName}!
          <br />
          Well done, heroes! 🏆
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleClaimRewards}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 px-4 rounded transition"
          >
            Claim Rewards
          </Button>
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
          >
            Continue
          </button>
        </div>

        {/* Flavor Text */}
        <p className="text-center text-yellow-400 text-xs mt-4 italic">
          Check back next weekend for another boss battle!
        </p>
      </div>
    </div>
  );
};

export default BossVictoryPopup;
