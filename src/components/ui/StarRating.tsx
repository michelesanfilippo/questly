interface StarRatingProps {
  value: number;
  max?: number;
  className?: string;
}

export function StarRating({ value, max = 5, className = '' }: StarRatingProps) {
  return (
    <div className={`flex gap-0.5 ${className}`} aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`text-sm ${i < value ? 'text-gold' : 'text-slate-300 dark:text-slate-600'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
