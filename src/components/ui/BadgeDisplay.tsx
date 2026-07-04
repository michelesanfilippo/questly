'use client';

interface Badge {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
}

interface BadgeDisplayProps {
  badge: Badge;
  nickname: string;
}

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="inline-block w-4 h-4 mr-1 align-middle"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12 1.5a.75.75 0 0 1 .64.361l2.25 3.75a.75.75 0 0 1-.64 1.139H9.75a.75.75 0 0 1-.64-1.139l2.25-3.75A.75.75 0 0 1 12 1.5ZM12 3.31 10.658 5.5h2.684L12 3.31ZM3 8.25A.75.75 0 0 1 3.75 7.5h16.5a.75.75 0 0 1 .75.75v.75a9.75 9.75 0 0 1-9 9.716V21h2.25a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1 0-1.5H10.5v-2.284A9.75 9.75 0 0 1 1.5 9V8.25A.75.75 0 0 1 2.25 7.5H3V8.25Z"
      clipRule="evenodd"
    />
  </svg>
);

export function BadgeDisplay({ badge, nickname }: BadgeDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center text-sm font-semibold ${badge.color}`}>
        <ShieldIcon />
        {badge.name}
      </span>
      <span className="text-slate-200 text-sm">{nickname}</span>
    </div>
  );
}
