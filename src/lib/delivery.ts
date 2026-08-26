const DEFAULT_RANGE = { min: 3, max: 5 };

/** Parses admin-edited freeform text like "3-5 business days" or "2 business days". */
export function parseDaysRange(text: string): { min: number; max: number } {
  const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };

  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    const days = Number(singleMatch[1]);
    return { min: days, max: days };
  }

  return DEFAULT_RANGE;
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) remaining -= 1;
  }
  return result;
}

export function estimateDeliveryRange({
  processingDays,
  rangeText,
  from,
}: {
  processingDays: number;
  rangeText: string;
  from: Date;
}): { min: Date; max: Date } {
  const { min, max } = parseDaysRange(rangeText);
  return {
    min: addBusinessDays(from, processingDays + min),
    max: addBusinessDays(from, processingDays + max),
  };
}

export function formatDeliveryRange(min: Date, max: Date): string {
  const day = (d: Date) => d.getDate();
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

  if (min.getMonth() === max.getMonth()) {
    return `${day(min)} – ${day(max)} ${month(max)}`;
  }
  return `${day(min)} ${month(min)} – ${day(max)} ${month(max)}`;
}
