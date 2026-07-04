'use client';

// Stars visible only in dark mode; warm glow particles in light mode
const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 70}%`,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 3}s`,
  size: Math.random() > 0.7 ? 3 : 2,
}));

export function AmbientEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Dark mode: stars */}
      {STARS.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white opacity-0 dark:opacity-60 animate-star-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}

      {/* Light mode: warm dawn glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-30 dark:opacity-0 blur-3xl"
        style={{ background: 'radial-gradient(circle, #F97316, transparent)' }}
      />

      {/* Dark mode: moon glow */}
      <div
        className="absolute top-8 right-16 w-20 h-20 rounded-full opacity-0 dark:opacity-20 blur-2xl"
        style={{ background: 'radial-gradient(circle, #A78BFA, transparent)' }}
      />
    </div>
  );
}
