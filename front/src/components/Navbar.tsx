import { useState } from "react";
import type { CSSProperties } from "react";
import LoginButton from "./LoginButton";
import RegisterButton from "./RegisterButton";

type NavbarProps = {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
};

type NavLinkItem = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLinkItem[] = [
  { label: "Início", href: "/#inicio" },
  { label: "Benefícios", href: "/#beneficios" },
  { label: "Depoimentos", href: "/#depoimentos" },
  { label: "Contato", href: "/#contato" },
];

function NavbarLink({ href, label }: NavLinkItem) {
  const [hover, setHover] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.navLink,
        ...(hover ? styles.navLinkHover : null),
      }}
    >
      {label}
    </a>
  );
}

export default function Navbar({
  onLoginClick,
  onRegisterClick,
}: NavbarProps) {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Brand */}
        <a href="/#inicio" style={styles.brandLink} aria-label="Ir para o início">
          <img src="/keeply-cloud-hero.png" alt="Keeply" style={styles.logoImage} />

          <span style={styles.brandText}>Keeply</span>
        </a>

        {/* Centro + ações */}
        <div style={styles.rightArea}>
          <nav style={styles.nav} aria-label="Navegação principal">
            {NAV_LINKS.map((item) => (
              <NavbarLink key={item.href} {...item} />
            ))}
          </nav>

          <div style={styles.actions}>
            <LoginButton onClick={onLoginClick} />
            <RegisterButton onClick={onRegisterClick} />
          </div>
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.82)",
    borderBottom: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 6px 20px rgba(15,23,42,0.03)",
  },

  container: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },

  brandLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    minWidth: 160,
    textDecoration: "none",
    flexShrink: 0,
  },

  logoImage: {
    width: 30,
    height: 30,
    display: "block",
    objectFit: "contain",
  },

  brandText: {
    fontWeight: 900,
    fontSize: "1.28rem",
    color: "#0f172a",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    whiteSpace: "nowrap",
  },

  rightArea: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: 1,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  navLink: {
    color: "#475569",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "0.92rem",
    padding: "8px 10px",
    borderRadius: 10,
    transition: "all 180ms ease",
    lineHeight: 1,
    whiteSpace: "nowrap",
    border: "1px solid transparent",
  },

  navLinkHover: {
    color: "#1d4ed8",
    background: "rgba(37,99,235,0.06)",
    border: "1px solid rgba(37,99,235,0.08)",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
};
