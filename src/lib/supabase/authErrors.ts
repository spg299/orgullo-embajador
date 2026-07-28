import { isAuthRetryableFetchError } from "@supabase/supabase-js";

// Structured error codes from GoTrue (Supabase Auth) — present on every
// AuthApiError since supabase-js v2.40. This is the reliable signal: it
// comes straight from Supabase's server, not from parsing English text, so
// it can't be broken by a wording change and won't misfire on unrelated
// messages that happen to contain a matched phrase. See node_modules/
// @supabase/auth-js/dist/module/lib/error-codes.d.ts for the full list.
const codeMessages: Record<string, string> = {
  user_already_exists: "Ya existe una cuenta con este correo.",
  email_exists: "Ya existe una cuenta con este correo.",
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed:
    "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  weak_password: "La contraseña debe tener al menos 6 caracteres.",
  email_address_invalid: "El correo electrónico no es válido.",
  validation_failed: "Revisa los datos ingresados e intenta de nuevo.",
  // Two genuinely different rate limits Supabase enforces — collapsing them
  // into one message hid which one was actually hit. The email-send limit
  // is the one the free tier's built-in mailer trips easily (a handful of
  // emails per hour); the request limit is about signup/login attempts
  // themselves.
  over_email_send_rate_limit:
    "Se enviaron demasiados correos a esta dirección. Espera unos minutos antes de intentar de nuevo.",
  over_request_rate_limit:
    "Demasiados intentos desde este dispositivo. Espera unos minutos e intenta de nuevo.",
  over_sms_send_rate_limit: "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  signup_disabled: "El registro de nuevas cuentas está deshabilitado temporalmente.",
  user_banned: "Esta cuenta fue suspendida. Contacta a soporte si crees que es un error.",
  captcha_failed: "No se pudo verificar que eres una persona. Intenta de nuevo.",
};

// Fallback for errors that don't carry a .code — older responses, or a
// plain Error thrown by something other than GoTrue. Kept narrow and
// ordered most-specific-first so "email rate limit" doesn't get swallowed
// by the more general "rate limit" pattern below it.
const patterns: Array<[RegExp, string]> = [
  [/already registered/i, "Ya existe una cuenta con este correo."],
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/email not confirmed/i, "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/unable to validate email address/i, "El correo electrónico no es válido."],
  [/email rate limit/i, "Se enviaron demasiados correos a esta dirección. Espera unos minutos antes de intentar de nuevo."],
  [/rate limit/i, "Demasiados intentos. Espera unos minutos e intenta de nuevo."],
];

export function supabaseAuthErrorMessage(error: unknown): string {
  const message = (error as { message?: string })?.message ?? "";

  // 1. Network-level failure: the request never reached Supabase at all
  //    (DNS failure, offline, CORS, timeout). This error class specifically
  //    signals that — check it before .code, since it never carries one.
  if (isAuthRetryableFetchError(error)) {
    return "Error de conexión. Revisa tu internet e intenta de nuevo.";
  }

  // 2. Structured error code — the primary, reliable signal.
  const code = (error as { code?: string })?.code;
  if (code && code in codeMessages) return codeMessages[code];

  // 3. HTTP status without a recognized code: 5xx means Supabase's own
  //    servers failed, which is a different situation from anything the
  //    user did wrong.
  const status = (error as { status?: number })?.status;
  if (typeof status === "number" && status >= 500) {
    return "Ocurrió un error en el servidor de autenticación. Inténtalo de nuevo en unos minutos.";
  }

  // 4. Last resort: match on the raw English message text.
  for (const [pattern, friendly] of patterns) {
    if (pattern.test(message)) return friendly;
  }

  // No friendly translation for this one — surface Supabase's real message
  // instead of a generic "something went wrong" that hides what happened.
  return message || "Error desconocido al comunicarse con Supabase.";
}
