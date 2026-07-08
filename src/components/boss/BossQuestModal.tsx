import React, { useState } from 'react';
import { useI18n } from '@/i18n';

interface BossMission {
  id: string;
  title: string;
  text: string;
}

interface BossQuestModalProps {
  quest: BossMission;
  bossName: string;
  onSubmit: (answer: string, score: number) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export const BossQuestModal: React.FC<BossQuestModalProps> = ({
  quest,
  bossName,
  onSubmit,
  onClose,
  isSubmitting,
}) => {
  const { t } = useI18n();
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(50);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }
    await onSubmit(answer, score);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border-2 border-amber-700 bg-gradient-to-b from-gray-900 to-gray-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-amber-700/30 pb-4">
          <h2 className="text-2xl font-bold text-amber-100">
            ⚔️ {bossName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Quest Title */}
        <h3 className="mb-3 text-lg font-semibold text-amber-200">{quest.title}</h3>

        {/* Quest Text */}
        <div className="mb-6 rounded-lg bg-gray-800 p-4">
          <p className="whitespace-pre-wrap text-gray-200 leading-relaxed">
            {quest.text}
          </p>
        </div>

        {/* Answer Input */}
        <div className="mb-6">
          <label className="mb-2 block text-amber-200 font-semibold">
            Your Answer:
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full rounded-lg border border-amber-700/50 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50"
          />
        </div>

        {/* Quality Score Slider */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-amber-200 font-semibold">
              Answer Quality:
            </label>
            <span className="text-lg font-bold text-amber-300">{score}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value))}
            disabled={isSubmitting}
            className="w-full cursor-pointer accent-amber-600"
          />
          <div className="mt-2 text-xs text-amber-400/70">
            Score represents answer quality. Role bonuses apply: Wizard +50%, Royal Knight +20%
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !answer.trim()}
            className="flex-1 rounded-lg border border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Attacking...' : 'Submit Attack'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-amber-600 bg-gray-800 px-4 py-2 font-bold text-amber-100 transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
