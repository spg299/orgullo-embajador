import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "whatsapp" | "ghost" | "outline-light";
type Size = "md" | "lg" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-gold-400 to-gold-500 text-navy-950 hover:from-gold-300 hover:to-gold-400 shadow-[0_10px_30px_-10px_rgba(204,154,46,0.6)]",
  secondary:
    "bg-navy-900 text-white hover:bg-navy-800 shadow-[0_10px_30px_-10px_rgba(10,15,36,0.5)]",
  whatsapp:
    "bg-whatsapp-500 text-white hover:bg-whatsapp-600 shadow-[0_10px_30px_-10px_rgba(37,211,102,0.55)]",
  ghost: "bg-transparent text-navy-900 hover:bg-navy-900/5",
  "outline-light":
    "bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-4 py-2 gap-1.5",
  md: "text-sm px-6 py-3 gap-2",
  lg: "text-base px-8 py-4 gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-all duration-300 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  children: ReactNode;
}

interface ButtonAsButton
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

interface ButtonAsLink extends CommonProps {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "left",
    className = "",
    children,
  } = props;

  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = (
    <>
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { href: _href, ...buttonProps } = props as ButtonAsButton;
  void _href;

  return (
    <button {...buttonProps} className={classes}>
      {content}
    </button>
  );
}
