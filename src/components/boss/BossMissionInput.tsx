import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { useQuestTranslation } from '@/hooks/useQuestTranslation';
import bossMissionsData from '@/data/boss_missions.json';

interface BossMission {
  id: string;
  title: string;
  description: string;
  difficulty: number;
}

interface BossMissionInputProps {
  bossKey: string;
  guildId: string;
  onMissionSelect: (mission: BossMission, score: number) => Promise<void>;
  isLoading?: boolean;
  currentUserRole?: 'leader' | 'royal_knight' | 'wizard' | 'member';
}

/**
 * BossMissionInput
 *
 * Allows user to:
 * 1. Select a difficulty (1-5 stars) with available missions
 * 2. See mission details (title + description)
 * 3. Submit mission score (0-100)
 * 4. Triggers onMissionSelect callback with mission + score
 *
 * Missions loaded from boss_missions.json
 */
export const BossMissionInput: React.FC<BossMissionInputProps> = ({
  bossKey,
  guildId,
  onMissionSelect,
  isLoading = false,
  currentUserRole = 'member',
}) => {
  const { t } = useQuestTranslation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(3);
  const [selectedMission, setSelectedMission] = useState<BossMission | null>(null);
  const [score, setScore] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available missions for this boss + difficulty
  const getAvailableMissions = (difficulty: number): BossMission[] => {
    try {
      const bossMissions = (bossMissionsData as any).boss_missions;
      const bossData = bossMissions[bossKey];

      if (!bossData) {
        console.warn(`No missions found for boss: ${bossKey}`);
        return [];
      }

      const difficultyMissions = bossData[String(difficulty)];
      if (!difficultyMissions) {
        console.warn(
          `No missions found for boss ${bossKey} difficulty ${difficulty}`
        );
        return [];
      }

      return Array.isArray(difficultyMissions)
        ? difficultyMissions
        : [difficultyMissions];
    } catch (e) {
      console.error('Error loading boss missions:', e);
      return [];
    }
  };

  const availableMissions = getAvailableMissions(selectedDifficulty);

  // Auto-select first mission when difficulty changes
  useEffect(() => {
    const missions = getAvailableMissions(selectedDifficulty);
    if (missions.length > 0) {
      setSelectedMission(missions[0]);
    }
    setError(null);
  }, [selectedDifficulty]);

  // Handle mission submission
  const handleSubmit = async () => {
    if (!selectedMission) {
      setError('Please select a mission');
      return;
    }

    if (score < 0 || score > 100) {
      setError('Score must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onMissionSelect(selectedMission, score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Difficulty Selector */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-300 mb-3">
          Select Mission Difficulty
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-4 py-2 rounded font-bold transition ${
                selectedDifficulty === diff
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {'⭐'.repeat(diff)}
            </button>
          ))}
        </div>
      </div>

      {/* Mission Selector */}
      {availableMissions.length > 0 ? (
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-300 mb-3">
            Select Mission ({availableMissions.length} available)
          </label>
          <select
            value={selectedMission?.id || ''}
            onChange={(e) => {
              const mission = availableMissions.find((m) => m.id === e.target.value);
              if (mission) setSelectedMission(mission);
            }}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            {availableMissions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-6 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
          No missions available for this difficulty
        </div>
      )}

      {/* Mission Details */}
      {selectedMission && (
        <div className="mb-6 p-4 bg-gray-700 border border-gray-600 rounded">
          <h4 className="font-bold text-purple-300 mb-2">{selectedMission.title}</h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            {selectedMission.description}
          </p>
        </div>
      )}

      {/* Score Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-300 mb-2">
          Mission Score: <span className="text-purple-300">{score}</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full"
          disabled={isSubmitting || isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (Poor)</span>
          <span>50 (Good)</span>
          <span>100 (Perfect)</span>
        </div>
      </div>

      {/* Role Bonus Info */}
      {currentUserRole && currentUserRole !== 'member' && (
        <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-600 rounded text-xs text-blue-300">
          <p>
            <strong>{currentUserRole}</strong> role: +
            {currentUserRole === 'royal_knight'
              ? '20%'
              : currentUserRole === 'wizard'
                ? '50%'
                : '0%'}{' '}
            damage bonus
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || isLoading || !selectedMission}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
      >
        {isSubmitting ? 'Submitting...' : 'Submit & Attack'}
      </Button>

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Higher scores = more damage. Choose missions and score based on your skill!
      </p>
    </div>
  );
};

export default BossMissionInput;
