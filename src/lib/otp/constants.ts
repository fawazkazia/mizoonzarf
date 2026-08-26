export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 45;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS_PER_PHONE_PER_HOUR = 5;
export const OTP_MAX_SENDS_PER_IP_PER_HOUR = 10;
export const GUEST_VERIFIED_PHONE_TTL_DAYS = 7;
export const COD_CONFIRM_VALIDITY_MINUTES = 15;

export const OTP_TEMPLATES = {
  PHONE_VERIFY: "phone_verify_otp",
  COD_RISK_CONFIRM: "cod_risk_confirm_otp",
} as const;

export const GUEST_PHONE_TOKEN_COOKIE = "guest_phone_token";
