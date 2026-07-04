'use client';

// VillageScene: illustrated fantasy village — replace SVG with actual artwork in production
export function VillageScene() {
  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      {/* Sky gradient handled by parent section */}
      {/* Village silhouette placeholder */}
      <div className="absolute bottom-0 w-full h-2/3 flex items-end justify-center gap-4 px-8">
        {/* Tower */}
        <div className="w-8 h-32 bg-forest-green-dark dark:bg-mystic-purple-dark rounded-t-sm opacity-80" />
        {/* Main hall */}
        <div className="w-20 h-24 bg-forest-green dark:bg-mystic-purple-dark rounded-t-lg opacity-90" />
        {/* Cottage */}
        <div className="w-12 h-16 bg-forest-green-light dark:bg-night-blue-light rounded-t-sm opacity-80" />
        {/* Large tower */}
        <div className="w-10 h-40 bg-forest-green-dark dark:bg-mystic-purple rounded-t-full opacity-85" />
        {/* Small house */}
        <div className="w-14 h-20 bg-forest-green-light dark:bg-night-blue-light rounded-t-md opacity-75" />
      </div>
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-12 bg-forest-green dark:bg-night-blue-dark opacity-90" />
    </div>
  );
}
