import { z } from "zod";

/** Mirrors the Prisma `ObjectPosition` enum. Kept as a plain string union
 * (not imported from `@/generated/prisma/client`) so this file has no
 * Prisma dependency and can be used from client components. */
export const OBJECT_POSITIONS = ["CENTER", "TOP", "BOTTOM", "LEFT", "RIGHT"] as const;
export type ObjectPositionValue = (typeof OBJECT_POSITIONS)[number];

export const OBJECT_POSITION_LABELS: Record<ObjectPositionValue, string> = {
  CENTER: "Center",
  TOP: "Top",
  BOTTOM: "Bottom",
  LEFT: "Left",
  RIGHT: "Right",
};

export const objectPositionSchema = z.enum(OBJECT_POSITIONS).nullable().optional();

/** Maps a stored preset to the Tailwind object-position utility. `null`/`undefined`
 * falls back to `fallback` (each consumer picks its own pre-CMS default, since some
 * components historically hardcoded something other than center, e.g. `object-top`). */
export function objectPositionClass(
  pos: ObjectPositionValue | null | undefined,
  fallback: string = "object-center"
): string {
  switch (pos) {
    case "TOP":
      return "object-top";
    case "BOTTOM":
      return "object-bottom";
    case "LEFT":
      return "object-left";
    case "RIGHT":
      return "object-right";
    case "CENTER":
      return "object-center";
    default:
      return fallback;
  }
}
