const patterns: Array<[RegExp, string]> = [
  [/already registered/i, "Ya existe una cuenta con este correo."],
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/email not confirmed/i, "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/unable to validate email address/i, "El correo electrónico no es válido."],
  [/rate limit/i, "Demasiados intentos. Intenta de nuevo en unos minutos."],
  [/network/i, "Error de conexión. Revisa tu internet e intenta de nuevo."],
];

export function supabaseAuthErrorMessage(error: unknown): string {
  const message = (error as { message?: string })?.message ?? "";
  for (const [pattern, friendly] of patterns) {
    if (pattern.test(message)) return friendly;
  }
  // No friendly translation for this one — surface Supabase's real message
  // instead of a generic "something went wrong" that hides what happened.
  return message || "Error desconocido al comunicarse con Supabase.";
}
