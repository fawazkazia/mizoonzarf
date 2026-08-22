interface IconProps {
  size?: number;
  className?: string;
}

/** lucide-react dropped brand/logo glyphs; these are minimal inline stand-ins. */
export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.5 8.5h2V5.2h-2.4c-2.4 0-3.8 1.5-3.8 3.9v1.9H8v3.3h2.3V21h3.4v-6.7h2.3l.4-3.3h-2.7V9.4c0-.6.3-.9 1-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function XIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 4l7 8.5L4.4 20H6l5.8-6.3L16 20h4l-7.3-8.9L19.6 4H18l-5.4 5.8L8 4H4Z"
        fill="currentColor"
      />
    </svg>
  );
}
