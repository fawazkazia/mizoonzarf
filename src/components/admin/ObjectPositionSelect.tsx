import { Field, Select } from "@/components/admin/FormField";
import { OBJECT_POSITIONS, OBJECT_POSITION_LABELS, type ObjectPositionValue } from "@/lib/object-position";

/** Admin control for the "simple object-position preset" image field — see
 * src/lib/object-position.ts. Not a crop/focal-point tool; just a CSS
 * object-position preset, cheap to apply consistently across every image slot. */
export function ObjectPositionSelect({
  value,
  onChange,
  label = "Image Position",
}: {
  value: ObjectPositionValue | null;
  onChange: (value: ObjectPositionValue | null) => void;
  label?: string;
}) {
  return (
    <Field label={label} hint="Adjusts how the image is cropped within its frame — useful when the same image needs to look right at different screen sizes.">
      <Select value={value ?? ""} onChange={(e) => onChange((e.target.value || null) as ObjectPositionValue | null)}>
        <option value="">Default</option>
        {OBJECT_POSITIONS.map((pos) => (
          <option key={pos} value={pos}>
            {OBJECT_POSITION_LABELS[pos]}
          </option>
        ))}
      </Select>
    </Field>
  );
}
