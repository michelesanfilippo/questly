interface ScoreDisplayProps {
  label: string;
  value: number;
  className?: string;
}

export function ScoreDisplay({ label, value, className = '' }: ScoreDisplayProps) {
  const color = value >= 80 ? 'bg-forest-green' : value >= 60 ? 'bg-gold' : value >= 40 ? 'bg-dawn-orange' : 'bg-red-400';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
