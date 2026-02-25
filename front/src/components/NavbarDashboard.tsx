import { useEffect, useMemo, useState, useCallback, useRef } from "react";

type NavbarDashboardProps = {
  userName: string;
  userEmail: string;
  onLogout?: () => void;
};

type NavItem = {
  key: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "inicio", label: "Inicio" },
  { key: "agentes", label: "Agentes" },
  { key: "backups", label: "Backups" },
  { key: "configuracoes", label: "Configurações" },
  { key: "perfil", label: "Perfil" },
];

function getDefaultActiveKey() {
  return NAV_ITEMS[0]?.key ?? "inicio";
}

function normalizeHashToKey(hash: string): string | null {
  if (!hash) return null;
  const value = hash.replace(/^#/, "").trim().toLowerCase();
  if (!value) return null;
  return NAV_ITEMS.some((item) => item.key === value) ? value : null;
}

function getActiveKeyFromLocation(): string {
  if (typeof window === "undefined") return getDefaultActiveKey();

  if (window.location.pathname === "/profile") {
    return "perfil";
  }

  return normalizeHashToKey(window.location.hash) ?? getDefaultActiveKey();
}

function getHrefForItem(item: NavItem): string {
  if (typeof window === "undefined") {
    return item.key === "perfil" ? "/profile" : `/dashboard#${item.key}`;
  }

  if (item.key === "perfil") return "/profile";

  if (window.location.pathname === "/dashboard") {
    return `#${item.key}`;
  }

  return `/dashboard#${item.key}`;
}

function safeBaseForInitials(name: string, email: string) {
  const n = (name || "").trim();
  if (n && n.toLowerCase() !== "usuário" && n.toLowerCase() !== "usuario") return n;
  const local = (email || "").split("@")[0] || "";
  return local.trim() || "US";
}

function getInitials(name: string, email: string): string {
  const base = safeBaseForInitials(name, email)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const parts = base
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "US";
  const initials = parts.map((p) => (p[0] || "").toUpperCase()).join("");
  return initials || "US";
}

function getShortName(name: string, email: string) {
  const n = (name || "").trim();
  const base = n && n.toLowerCase() !== "usuário" && n.toLowerCase() !== "usuario"
    ? n
    : (email || "").split("@")[0] || "Usuário";

  return base.trim().split(/\s+/)[0] || "Usuário";
}

export default function NavbarDashboard({
  userName,
  userEmail,
  onLogout,
}: NavbarDashboardProps) {
  const initials = useMemo(() => getInitials(userName, userEmail), [userName, userEmail]);
  const shortName = useMemo(() => getShortName(userName, userEmail), [userName, userEmail]);

  const [activeKey, setActiveKey] = useState<string>(() => getActiveKeyFromLocation());

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromLocation = () => setActiveKey(getActiveKeyFromLocation());
    const onHashChange = () => syncFromLocation();
    const onPopState = () => syncFromLocation();
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onPopState);
    syncFromLocation();

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (profileMenuRef.current?.contains(target)) return;
      setProfileOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  const onNavClick = useCallback((key: string) => {
    setActiveKey(key);
    setMobileOpen(false);
    setProfileOpen(false);
  }, []);

  const onProfileToggle = useCallback(() => {
    setProfileOpen((v) => !v);
  }, []);

  const onLogoutClick = useCallback(() => {
    setProfileOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("keeply_access_token");
    localStorage.removeItem("keeply_refresh_token");
    window.location.href = "/login";
  }, [onLogout]);

  return (
    <>
      <style>{css}</style>

      <header className="kd-wrap" aria-label="Navegação da dashboard">
        <a className="kd-brand" href="/dashboard" aria-label="Ir para dashboard">
          <img className="kd-logo" src="/keeply-cloud-hero.png" alt="Keeply" />
          <span className="kd-brandText">Keeply</span>
        </a>

        <button
          className="kd-burger"
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          aria-controls="kd-nav"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="kd-burgerLine" />
          <span className="kd-burgerLine" />
          <span className="kd-burgerLine" />
        </button>

        <nav
          id="kd-nav"
          className={`kd-nav ${mobileOpen ? "is-open" : ""}`}
          aria-label="Seções"
        >
          {NAV_ITEMS.map((item) => {
            const href = getHrefForItem(item);
            const active = item.key === activeKey;
            return (
              <a
                key={item.key}
                href={href}
                className={`kd-link ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => onNavClick(item.key)}
              >
                <span className="kd-linkLabel">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="kd-profileWrap" ref={profileMenuRef}>
          <button
            className={`kd-profile ${profileOpen ? "is-open" : ""}`}
            type="button"
            title={userEmail}
            onClick={onProfileToggle}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label="Abrir menu do perfil"
          >
            <div className="kd-avatar" aria-hidden="true">
              {initials}
            </div>

            <div className="kd-profileText">
              <span className="kd-profileLabel">Perfil</span>
              <strong className="kd-profileName">{shortName}</strong>
            </div>
          </button>

          {profileOpen && (
            <div className="kd-profileMenu" role="menu" aria-label="Menu do perfil">
              <div className="kd-profileMenuSection">
                <span className="kd-menuCaption">E-mail</span>
                <span className="kd-menuEmail">{userEmail || "Não informado"}</span>
              </div>

              <button
                type="button"
                className="kd-menuLogout"
                role="menuitem"
                onClick={onLogoutClick}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

const css = `
:root{
  --kd-bg: #ffffff;
  --kd-border: rgba(148,163,184,0.18);
  --kd-shadow: 0 10px 24px rgba(15,23,42,0.05);
  --kd-text: #0f172a;
  --kd-muted: #64748b;
  --kd-muted2: #475569;
  --kd-link: #334155;
  --kd-primary: #1d4ed8;
  --kd-ring: 0 0 0 4px rgba(37,99,235,0.18);
}

.kd-wrap{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
  background: var(--kd-bg);
  border: 1px solid var(--kd-border);
  border-radius: 16px;
  padding: 10px 14px;
  box-shadow: var(--kd-shadow);
}

.kd-brand{
  display:inline-flex;
  align-items:center;
  gap:10px;
  text-decoration:none;
  min-width:140px;
  flex-shrink:0;
}
.kd-brand:focus-visible{ outline:none; box-shadow: var(--kd-ring); border-radius: 14px; }

.kd-logo{
  width:28px;
  height:28px;
  object-fit:contain;
  display:block;
}

.kd-brandText{
  color: var(--kd-text);
  font-weight: 900;
  font-size: 1.16rem;
  letter-spacing: -0.03em;
  line-height: 1;
}

.kd-burger{
  display:none;
  border: 1px solid var(--kd-border);
  background: rgba(248,250,252,0.9);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
}
.kd-burger:focus-visible{ outline:none; box-shadow: var(--kd-ring); }
.kd-burgerLine{
  display:block;
  width:18px;
  height:2px;
  background: #0f172a;
  opacity: 0.9;
  border-radius: 999px;
}
.kd-burgerLine + .kd-burgerLine{ margin-top:4px; }

.kd-nav{
  display:flex;
  align-items:center;
  justify-content:center;
  flex: 1 1 420px;
  min-width: 260px;
  gap: 6px;
  flex-wrap: wrap;
}

.kd-link{
  display:flex;
  align-items:center;
  gap:0;
  text-decoration:none;
  color: var(--kd-link);
  font-weight:700;
  font-size:0.92rem;
  border-radius:12px;
  padding:8px 10px;
  border:1px solid transparent;
  transition: transform 140ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease;
  transform: translateY(0);
}

.kd-link:hover{
  color: var(--kd-text);
  background: rgba(148,163,184,0.08);
  border-color: rgba(148,163,184,0.16);
  transform: translateY(-1px);
}

.kd-link:focus-visible{
  outline:none;
  box-shadow: var(--kd-ring);
}

.kd-link.is-active{
  color: var(--kd-text);
  background: rgba(148,163,184,0.10);
  border-color: rgba(148,163,184,0.18);
}

.kd-profileWrap{
  position:relative;
  flex-shrink:0;
}

.kd-profile{
  display:flex;
  align-items:center;
  gap:10px;
  min-width: 0;
  padding: 6px 12px 6px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.14);
  background: rgba(248,250,252,0.9);
  flex-shrink:0;
  cursor:pointer;
  appearance:none;
  color: inherit;
  text-align:left;
}
.kd-profile:hover{
  border-color: rgba(148,163,184,0.22);
  background: rgba(248,250,252,1);
}
.kd-profile:focus-visible{ outline:none; box-shadow: var(--kd-ring); }
.kd-profile.is-open{
  border-color: rgba(148,163,184,0.24);
  box-shadow: 0 8px 18px rgba(15,23,42,0.06);
}

.kd-avatar{
  width:42px;
  height:42px;
  border-radius:50%;
  background: linear-gradient(135deg, rgba(29,78,216,0.95) 0%, rgba(37,99,235,0.85) 100%);
  color:#fff;
  font-weight:900;
  font-size:0.9rem;
  display:grid;
  place-items:center;
  letter-spacing:-0.03em;
  box-shadow: 0 8px 16px rgba(37,99,235,0.18);
}

.kd-profileText{
  display:grid;
  gap:1px;
  min-width:0;
}

.kd-profileLabel{
  color: var(--kd-muted);
  font-weight:700;
  font-size:0.72rem;
  text-transform:uppercase;
  letter-spacing:0.10em;
}

.kd-profileName{
  color: var(--kd-text);
  font-size:0.90rem;
  line-height:1.1;
  letter-spacing:-0.02em;
  max-width: 110px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.kd-profileMenu{
  position:absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(280px, calc(100vw - 28px));
  background: #ffffff;
  border: 1px solid rgba(148,163,184,0.20);
  border-radius: 14px;
  box-shadow: 0 18px 34px rgba(15,23,42,0.10);
  padding: 8px;
  z-index: 40;
}

.kd-profileMenuSection{
  display:grid;
  gap: 4px;
  padding: 8px 10px 10px;
  border-bottom: 1px solid rgba(148,163,184,0.14);
  margin-bottom: 6px;
}

.kd-menuCaption{
  color: var(--kd-muted);
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kd-menuEmail{
  color: var(--kd-text);
  font-size: 0.88rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.kd-menuLogout{
  width: 100%;
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: #b91c1c;
  font-weight: 700;
  font-size: 0.90rem;
  text-align: left;
  border-radius: 10px;
  padding: 9px 10px;
  cursor: pointer;
}
.kd-menuLogout:hover{
  background: rgba(239,68,68,0.08);
  border-color: rgba(239,68,68,0.12);
}
.kd-menuLogout:focus-visible{
  outline: none;
  box-shadow: 0 0 0 4px rgba(239,68,68,0.14);
}

/* MOBILE */
@media (max-width: 860px){
  .kd-burger{ display:inline-flex; align-items:center; justify-content:center; }
  .kd-nav{
    display:none;
    width: 100%;
    order: 10;
    justify-content: flex-start;
    padding-top: 8px;
    border-top: 1px dashed rgba(148,163,184,0.22);
    margin-top: 6px;
  }
  .kd-nav.is-open{ display:flex; }
  .kd-link{ width: 100%; justify-content: flex-start; }
  .kd-profileWrap{
    width: 100%;
  }
  .kd-profile{
    width: 100%;
    justify-content: flex-start;
  }
  .kd-profileMenu{
    left: 0;
    right: auto;
    width: 100%;
  }
}

/* REDUZ ANIMAÇÃO SE O USUÁRIO PEDIR */
@media (prefers-reduced-motion: reduce){
  .kd-link{ transition:none; }
  .kd-link:hover{ transform:none; }
}
`;
