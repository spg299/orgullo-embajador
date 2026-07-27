const messages: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con este correo.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No existe una cuenta con este correo.",
  "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo en unos minutos.",
  "auth/network-request-failed": "Error de conexión. Revisa tu internet e intenta de nuevo.",
};

export function firebaseAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code && messages[code]) return messages[code];
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
