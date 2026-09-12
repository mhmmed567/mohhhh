 export function BottleIcon({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 220" className={className}>
      <rect
        x="46"
        y="8"
        width="28"
        height="20"
        rx="3"
        fill="none"
        stroke="#5B5E63"
        strokeWidth="2"
        className={animated ? "bottle-line" : undefined}
      />
      <rect
        x="53"
        y="26"
        width="14"
        height="16"
        fill="none"
        stroke="#5B5E63"
        strokeWidth="2"
        className={animated ? "bottle-line" : undefined}
      />
      <path
        d="M53 42 C 40 52, 22 60, 22 78 L 22 190 C 22 202, 32 210, 44 210 L 76 210 C 88 210, 98 202, 98 190 L 98 78 C 98 60, 80 52, 67 42 Z"
        fill="none"
        stroke="#5B5E63"
        strokeWidth="2"
        strokeLinejoin="round"
        className={animated ? "bottle-line" : undefined}
      />
      <rect
        x="30"
        y="120"
        width="60"
        height="82"
        rx="6"
        fill="#8B8F95"
        opacity="0.35"
        className={animated ? "liquid-fill" : undefined}
      />
    </svg>
  );
}
