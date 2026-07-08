import React, { useState } from 'react';

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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border-2 border-amber-700 bg-gradient-to-br from-amber-950 to-amber-900/50 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-amber-700 pb-4">
          <h2 className="text-2xl font-bold text-amber-100">
            ⚔️ Challenge: {bossName.toUpperCase()}
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
        <h3 className="mb-2 text-lg font-semibold text-amber-200">{quest.title}</h3>

        {/* Quest Text */}
        <div className="mb-6 rounded-lg bg-amber-950/50 p-4">
          <p className="whitespace-pre-wrap text-amber-100 leading-relaxed">
            {quest.text}
          </p>
        </div>

        {/* Answer Input */}
        <div className="mb-4">
          <label className="mb-2 block text-amber-200 font-semibold">
            Your Answer:
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full rounded-lg border border-amber-600 bg-amber-950 px-3 py-2 text-amber-100 placeholder-amber-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50"
          />
        </div>

        {/* Score Slider */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-amber-200 font-semibold">
              Confidence Level:
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
            className="w-full cursor-pointer"
          />
          <div className="mt-1 flex justify-between text-xs text-amber-400">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !answer.trim()}
            className="flex-1 rounded-lg border border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Attack'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-amber-600 bg-amber-900 px-4 py-2 font-bold text-amber-100 transition-colors hover:bg-amber-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
