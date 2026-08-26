import * as Flags from "country-flag-icons/react/3x2";

type FlagComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const flagComponents = Flags as unknown as Record<string, FlagComponent>;

/** Renders a country's flag as an inline SVG (ISO 3166-1 alpha-2 code, e.g. "AE", or "EU" for the eurozone). */
export function CountryFlag({
  code,
  title,
  className,
}: {
  code: string;
  title?: string;
  className?: string;
}) {
  const Flag = flagComponents[code?.toUpperCase()];
  if (!Flag) return null;

  return <Flag className={className} role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true} aria-label={title} />;
}
