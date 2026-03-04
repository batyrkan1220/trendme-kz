interface TrendMeLogoProps {
  size?: number;
  className?: string;
}

export function TrendMeLogo({ size = 48, className = "" }: TrendMeLogoProps) {
  const id = `logo-bg-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* Circle background */}
      <circle cx="24" cy="24" r="24" fill={`url(#${id})`} />
      {/* Play triangle */}
      <path
        d="M19 15 L19 33 L33 24 Z"
        fill="white"
        opacity="0.95"
      />
      {/* Upward arrow from play */}
      <path
        d="M30 22 L35 12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M32 12 L35 12 L35 15"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
