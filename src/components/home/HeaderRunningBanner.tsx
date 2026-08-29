"use client";

import { useSettings } from "@/components/SettingsContext";
import { buildHeaderPromoMessages } from "@/lib/currency";
import { RunningBanner } from "./RunningBanner";

/** Sits in the gap between the "Extra 15% Off" code banner and the
 * favourite-brands strip, right under the header on every page. */
export function HeaderRunningBanner() {
  const settings = useSettings();
  return <RunningBanner messages={buildHeaderPromoMessages(settings)} />;
}
