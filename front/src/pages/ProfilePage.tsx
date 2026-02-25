import { useCallback, useEffect, useMemo, useState } from "react";
import NavbarDashboard from "../components/NavbarDashboard";

type Tokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

function canUseDOM() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeGetItem(key: string) {
  if (!canUseDOM()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readTokens(): Tokens {
  return {
    accessToken: safeGetItem("keeply_access_token"),
    refreshToken: safeGetItem("keeply_refresh_token"),
  };
}

function safeRemoveItem(key: string) {
  if (!canUseDOM()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64Url.padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatUnixDate(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Não informado";
  return new Date(value * 1000).toLocaleString("pt-BR");
}

function formatBirthDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "Não informado";
  // aceita "YYYY-MM-DD" ou ISO completo
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function maskCPF(value: unknown): string {
  if (typeof value !== "string") return "Não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function extractUserDisplayName(payload: Record<string, unknown> | null, email: string): string {
  const meta =
    payload?.user_metadata && typeof payload.user_metadata === "object"
      ? (payload.user_metadata as Record<string, unknown>)
      : null;

  const fullName =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";

  if (fullName) return fullName;
  if (email && email !== "Não disponível") return email.split("@")[0] || "Usuário";
  return "Usuário";
}

function getInitials(name: string): string {
  const base = (name || "US")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

  const parts = base.split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((p) => (p[0] || "").toUpperCase()).join("");
  return (letters || "US").slice(0, 2);
}

function redirectToLogin() {
  if (!canUseDOM()) return;
  window.location.href = "/login";
}

export default function ProfilePage() {
  const [tokens, setTokens] = useState<Tokens>(() => readTokens());

  // mantém sincronizado com alterações em outra aba/janela
  useEffect(() => {
    if (!canUseDOM()) return;

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "keeply_access_token" || e.key === "keeply_refresh_token") {
        setTokens(readTokens());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const jwtPayload = useMemo(() => decodeJwtPayload(tokens.accessToken), [tokens.accessToken]);

  const nowSec = useMemo(() => Math.floor(Date.now() / 1000), []);
  const expSec = useMemo(() => (typeof jwtPayload?.exp === "number" ? jwtPayload.exp : null), [jwtPayload]);
  const isExpired = useMemo(() => (expSec ? expSec <= nowSec : false), [expSec, nowSec]);

  // gate: sem token, token inválido, ou expirado => login
  useEffect(() => {
    if (!tokens.accessToken) {
      redirectToLogin();
      return;
    }
    if (!jwtPayload) {
      redirectToLogin();
      return;
    }
    if (isExpired) {
      redirectToLogin();
    }
  }, [tokens.accessToken, jwtPayload, isExpired]);

  const handleLogout = useCallback(() => {
    safeRemoveItem("keeply_access_token");
    safeRemoveItem("keeply_refresh_token");
    setTokens(readTokens());
    redirectToLogin();
  }, []);

  const handleRefreshView = useCallback(() => {
    setTokens(readTokens());
  }, []);

  const sessionEmail =
    typeof jwtPayload?.email === "string" ? jwtPayload.email : "Não disponível";
  const sessionUserId =
    typeof jwtPayload?.sub === "string" ? jwtPayload.sub : "Não disponível";
  const role =
    typeof jwtPayload?.role === "string" ? jwtPayload.role : "Não informado";

  const sessionName = extractUserDisplayName(jwtPayload, sessionEmail);
  const initials = getInitials(sessionName);

  const userMetadata =
    jwtPayload?.user_metadata && typeof jwtPayload.user_metadata === "object"
      ? (jwtPayload.user_metadata as Record<string, unknown>)
      : null;

  const fullName =
    typeof userMetadata?.full_name === "string" && userMetadata.full_name.trim()
      ? userMetadata.full_name
      : sessionName;

  const phoneNumber =
    typeof userMetadata?.phone_number === "string" ? userMetadata.phone_number : null;

  const cpf = userMetadata?.cpf;
  const birthDate = userMetadata?.birth_date;

  const expText = formatUnixDate(jwtPayload?.exp);
  const expBadge = isExpired ? "Expirado" : expSec ? "Ativo" : "Indefinido";

  return (
    <>
      <style>{css}</style>

      <div className="pp-page">
        <div className="pp-navbarWrap">
          <NavbarDashboard userName={sessionName} userEmail={sessionEmail} onLogout={handleLogout} />
        </div>

        <header className="pp-header">
          <div className="pp-headerInner">
            <div>
              <h1 className="pp-title">Perfil</h1>
              <p className="pp-subtitle">
                Dados carregados do token atual. Se algo estiver errado aqui, o problema é a emissão/claims do JWT
                (não “o front”).
              </p>
            </div>

            <div className="pp-actions">
              <button type="button" className="pp-btn" onClick={handleRefreshView}>
                Recarregar dados
              </button>
              <button type="button" className="pp-btnDanger" onClick={handleLogout}>
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="pp-main">
          <section className="pp-grid" id="perfil">
            {/* HERO */}
            <article className="pp-card pp-hero">
              <div className="pp-summary">
                <div className="pp-avatar" aria-hidden="true">{initials}</div>

                <div className="pp-summaryText">
                  <span className="pp-chip">Conta</span>
                  <h2 className="pp-name">{fullName || "Não informado"}</h2>
                  <p className="pp-email">{sessionEmail}</p>
                </div>

                <div className={`pp-status ${isExpired ? "is-expired" : ""}`} aria-label="Status do token">
                  <span className="pp-statusDot" aria-hidden="true" />
                  <span className="pp-statusText">{expBadge}</span>
                </div>
              </div>

              <div className="pp-metaGrid">
                <div className="pp-metaChip">
                  <span className="pp-metaLabel">User ID</span>
                  <span className="pp-metaValue">{sessionUserId}</span>
                </div>
                <div className="pp-metaChip">
                  <span className="pp-metaLabel">Role</span>
                  <span className="pp-metaValue">{role}</span>
                </div>
                <div className="pp-metaChip">
                  <span className="pp-metaLabel">Expira em</span>
                  <span className="pp-metaValue">{expText}</span>
                </div>
              </div>
            </article>

            {/* PERFIL */}
            <article className="pp-card">
              <div className="pp-cardHeader">
                <span className="pp-cardLabel">Dados do Perfil</span>
                <h2 className="pp-cardTitle">Informações principais</h2>
              </div>

              <div className="pp-kv">
                <div className="pp-row">
                  <span className="pp-key">Nome completo</span>
                  <span className="pp-val">{fullName || "Não informado"}</span>
                </div>
                <div className="pp-row">
                  <span className="pp-key">E-mail</span>
                  <span className="pp-val">{sessionEmail}</span>
                </div>
                <div className="pp-row">
                  <span className="pp-key">Telefone</span>
                  <span className="pp-val">{phoneNumber || "Não informado"}</span>
                </div>
                <div className="pp-row">
                  <span className="pp-key">CPF</span>
                  <span className="pp-val">{maskCPF(cpf)}</span>
                </div>
                <div className="pp-row">
                  <span className="pp-key">Nascimento</span>
                  <span className="pp-val">{formatBirthDate(birthDate)}</span>
                </div>
              </div>
            </article>

            {/* SESSÃO (útil pra debug real) */}
            <article className="pp-card">
              <div className="pp-cardHeader">
                <span className="pp-cardLabel">Sessão</span>
                <h2 className="pp-cardTitle">Diagnóstico rápido</h2>
              </div>

              <div className="pp-kv">
                <div className="pp-row">
                  <span className="pp-key">Token presente</span>
                  <span className="pp-val">{tokens.accessToken ? "Sim" : "Não"}</span>
                </div>
                <div className="pp-row">
                  <span className="pp-key">Payload válido</span>
                  <span className="pp-val">{jwtPayload ? "Sim" : "Não"}</span>
                </div>
                <div className="pp-row">
                  <span className="pp-key">Expirado</span>
                  <span className="pp-val">{isExpired ? "Sim" : "Não"}</span>
                </div>
              </div>

              <p className="pp-hint">
                Se “Payload válido” = Não, geralmente é token corrompido, storage bloqueado, ou backend emitindo JWT fora do padrão.
              </p>
            </article>
          </section>
        </main>
      </div>
    </>
  );
}

const css = `
.pp-page{
  min-height:100vh;
  background:
    radial-gradient(circle at 12% 8%, rgba(59,130,246,0.12) 0%, transparent 38%),
    radial-gradient(circle at 90% 18%, rgba(16,185,129,0.09) 0%, transparent 44%),
    linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  color:#0f172a;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.pp-navbarWrap{
  position: sticky;
  top: 0;
  z-index: 20;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px 10px;
  background: linear-gradient(180deg, rgba(248,251,255,0.98) 0%, rgba(248,251,255,0.9) 72%, rgba(248,251,255,0) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.pp-headerInner{
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 20px 8px;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  flex-wrap:wrap;
}

.pp-title{
  margin:0;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.02;
}

.pp-subtitle{
  margin: 10px 0 0;
  max-width: 760px;
  color: #475569;
  line-height: 1.5;
  font-size: 1rem;
}

.pp-actions{ display:flex; gap:10px; flex-wrap:wrap; }

.pp-btn{
  appearance:none;
  border: 1px solid rgba(148,163,184,0.35);
  background: rgba(255,255,255,0.92);
  color:#0f172a;
  font-weight:800;
  border-radius: 12px;
  padding: 10px 14px;
  cursor:pointer;
  box-shadow: 0 8px 16px rgba(15,23,42,0.04);
  transition: transform 140ms ease, box-shadow 140ms ease;
}
.pp-btn:hover{ transform: translateY(-1px); box-shadow: 0 14px 26px rgba(15,23,42,0.08); }
.pp-btn:active{ transform: translateY(0px); }

.pp-btnDanger{
  appearance:none;
  border: 1px solid rgba(239,68,68,0.28);
  background: rgba(254,242,242,0.92);
  color:#7f1d1d;
  font-weight:900;
  border-radius: 12px;
  padding: 10px 14px;
  cursor:pointer;
  box-shadow: 0 8px 16px rgba(15,23,42,0.04);
  transition: transform 140ms ease, box-shadow 140ms ease;
}
.pp-btnDanger:hover{ transform: translateY(-1px); box-shadow: 0 14px 26px rgba(15,23,42,0.08); }

.pp-main{
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 20px 34px;
}

.pp-grid{
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  align-items:start;
  scroll-margin-top: 104px;
}

.pp-card{
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(148,163,184,0.16);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 18px 36px rgba(15,23,42,0.05);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.pp-hero{ grid-column: 1 / -1; }

.pp-summary{
  display:flex;
  align-items:center;
  gap:16px;
  flex-wrap:wrap;
}

.pp-avatar{
  width:64px;
  height:64px;
  border-radius:50%;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  color:#fff;
  font-weight: 900;
  font-size: 1.1rem;
  display:grid;
  place-items:center;
  box-shadow: 0 12px 22px rgba(37,99,235,0.18);
  flex-shrink:0;
}

.pp-summaryText{ display:grid; gap:6px; min-width:0; flex: 1 1 280px; }

.pp-chip{
  display:inline-flex;
  width: fit-content;
  border-radius:999px;
  border: 1px solid rgba(37,99,235,0.12);
  background: rgba(37,99,235,0.06);
  color:#1e3a8a;
  font-weight:800;
  font-size:0.72rem;
  padding: 6px 10px;
  letter-spacing:0.08em;
  text-transform: uppercase;
}

.pp-name{
  margin:0;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-size: 1.2rem;
}

.pp-email{ margin:0; color:#475569; overflow-wrap:anywhere; }

.pp-status{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(16,185,129,0.18);
  background: rgba(236,253,245,0.75);
  color:#065f46;
  font-weight: 900;
}
.pp-status.is-expired{
  border-color: rgba(239,68,68,0.24);
  background: rgba(254,242,242,0.78);
  color:#7f1d1d;
}
.pp-statusDot{
  width:8px; height:8px; border-radius:50%;
  background: currentColor;
  opacity: 0.8;
}

.pp-metaGrid{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.pp-metaChip{
  display:grid;
  gap:4px;
  border-radius: 14px;
  border: 1px solid rgba(148,163,184,0.14);
  background: rgba(248,250,252,0.9);
  padding: 10px 12px;
}

.pp-metaLabel{
  color:#64748b;
  font-weight:800;
  font-size:0.72rem;
  letter-spacing:0.08em;
  text-transform: uppercase;
}

.pp-metaValue{
  color:#0f172a;
  font-weight:800;
  font-size:0.90rem;
  overflow-wrap:anywhere;
}

.pp-cardHeader{ display:grid; gap:10px; margin-bottom: 12px; }

.pp-cardLabel{
  display:inline-flex;
  width: fit-content;
  border-radius:999px;
  border: 1px solid rgba(148,163,184,0.18);
  background: rgba(248,250,252,0.9);
  color:#0f172a;
  font-weight:800;
  font-size:0.74rem;
  padding: 6px 10px;
}

.pp-cardTitle{
  margin:0;
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.pp-kv{ display:grid; gap:10px; }
.pp-row{
  display:grid;
  grid-template-columns: minmax(120px, 170px) 1fr;
  gap: 10px;
  align-items:start;
}
.pp-key{ color:#64748b; font-weight:800; font-size:0.84rem; }
.pp-val{ color:#0f172a; font-size:0.92rem; overflow-wrap:anywhere; }

.pp-hint{
  margin: 12px 0 0;
  color:#475569;
  font-size:0.92rem;
  line-height:1.45;
}

@media (max-width: 520px){
  .pp-row{ grid-template-columns: 1fr; }
}
`;