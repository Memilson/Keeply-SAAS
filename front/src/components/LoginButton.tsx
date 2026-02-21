import { useState } from "react";
import type { CSSProperties, ButtonHTMLAttributes } from "react";

type LoginButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export default function LoginButton({
  label = "Ja estou Protegido!",
  style,
  ...props
}: LoginButtonProps) {
  const [hover, setHover] = useState(false);

  const baseStyle: CSSProperties = {
    border: "1px solid #c7d8f8",
    background: hover ? "#f3f8ff" : "#ffffff",
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: "0.95rem",
    borderRadius: 12,
    padding: "12px 20px",
    cursor: "pointer",
    transition: "all 180ms ease",
    boxShadow: hover ? "0 8px 20px rgba(29, 78, 216, 0.10)" : "none",
    transform: hover ? "translateY(-1px)" : "translateY(0)",
    minWidth: 110,
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