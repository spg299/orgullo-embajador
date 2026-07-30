export interface BuyerFormValues {
  fullName: string;
  whatsapp: string;
  email: string;
  confirmEmail: string;
  acceptedTerms: boolean;
}

export const initialBuyerFormValues: BuyerFormValues = {
  fullName: "",
  whatsapp: "",
  email: "",
  confirmEmail: "",
  acceptedTerms: false,
};

export type BuyerFormErrors = Partial<Record<keyof BuyerFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBuyerForm(values: BuyerFormValues): BuyerFormErrors {
  const errors: BuyerFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Ingresa tu nombre completo.";
  }

  const whatsappDigits = values.whatsapp.replace(/\D/g, "");
  if (!values.whatsapp.trim()) {
    errors.whatsapp = "Ingresa tu número de WhatsApp.";
  } else if (whatsappDigits.length < 7 || whatsappDigits.length > 15) {
    errors.whatsapp = "Ingresa un número de WhatsApp válido.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Ingresa tu correo electrónico.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  const confirmEmail = values.confirmEmail.trim();
  if (!confirmEmail) {
    errors.confirmEmail = "Confirma tu correo electrónico.";
  } else if (confirmEmail !== email) {
    errors.confirmEmail = "Los correos no coinciden.";
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = "Debes aceptar los términos y condiciones.";
  }

  return errors;
}
