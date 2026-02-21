import { useState } from "react";
import type { CSSProperties, ButtonHTMLAttributes } from "react";

type RegisterButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export default function RegisterButton({
  label = "Ainda não estou protegido",
  style,
  ...props
}: RegisterButtonProps) {
  const [hover, setHover] = useState(false);

  const baseStyle: CSSProperties = {
    border: "none",
    background: hover
      ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
      : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "0.95rem",
    borderRadius: 12,
    padding: "12px 20px",
    cursor: "pointer",
    transition: "all 180ms ease",
    boxShadow: hover
      ? "0 14px 28px rgba(37, 99, 235, 0.32)"
      : "0 8px 18px rgba(37, 99, 235, 0.22)",
    transform: hover ? "translateY(-1px)" : "translateY(0)",
    minWidth: 140,
  };

  return (
    <button
      type="button"
      {...props}
      onMouseEnter={(e) => {
        setHover(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        props.onMouseLeave?.(e);
      }}
      style={{ ...baseStyle, ...style }}
    >
      {label}
    </button>
  );
}
