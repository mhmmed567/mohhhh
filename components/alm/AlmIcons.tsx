import type { SVGProps } from "react";

export function CupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 12h17v8a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7zM23 13h2a4 4 0 0 1 0 8h-2M4 29h21M11 8c-3-3 3-3 0-6M17 8c-3-3 3-3 0-6" />
    </svg>
  );
}

export function QrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="15" width="6" height="6" rx="1" />
      <path d="M15 15h2v2h4v4h-6v-3M3 12h3m6-9v3m0 4v4m0 7v-3m9-6h-4M6 6h.01M18 6h.01M6 18h.01" />
    </svg>
  );
}
