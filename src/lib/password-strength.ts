export type PasswordStrength = "weak" | "fair" | "strong";

export function scorePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  return "strong";
}

export const PASSWORD_STRENGTH_META: Record<PasswordStrength, { label: string; width: string }> = {
  weak: { label: "Weak", width: "w-1/3" },
  fair: { label: "Fair", width: "w-2/3" },
  strong: { label: "Strong", width: "w-full" },
};
