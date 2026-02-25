import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { API_BASE_URL, apiUrl } from "../config";
import NavbarDashboard from "../components/NavbarDashboard";

type ProbeState = "idle" | "loading" | "online" | "pending" | "error";

type ProbeResult = {
  state: ProbeState;
  title: string;
  message: string;
  statusCode?: number;
  payloadPreview?: string;
  checkedAt?: string;
};

const AGENT_STATUS_ENDPOINT = "/api/agent/status";

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function previewPayload(data: unknown): string | undefined {
  if (data == null) return undefined;

  try {
    const raw = JSON.stringify(data, null, 2);
    return raw.length > 320 ? `${raw.slice(0, 320)}...` : raw;
  } catch {
    return undefined;
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
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Não informado";
  }

  return new Date(value * 1000).toLocaleString("pt-BR");
}

function formatCheckedAt(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

function getStoredTokens() {
  return {
    accessToken: localStorage.getItem("keeply_access_token"),
    refreshToken: localStorage.getItem("keeply_refresh_token"),
  };
}

function extractUserDisplayName(
  payload: Record<string, unknown> | null,
  email: string
): string {
  const userMetadata =
    payload?.user_metadata && typeof payload.user_metadata === "object"
      ? (payload.user_metadata as Record<string, unknown>)
      : null;

  const fullName =
    typeof userMetadata?.full_name === "string" ? userMetadata.full_name.trim() : "";

  if (fullName) return fullName;
  if (email && email !== "Não disponível") return email.split("@")[0] || "Usuário";
  return "Usuário";
}

export default function DashboardPage() {
  const [tokens, setTokens] = useState(() => getStoredTokens());
  const [probe, setProbe] = useState<ProbeResult>({
    state: "idle",
    title: "Aguardando verificação",
    message:
      "A dashboard está pronta para consultar o backend Spring e exibir o status da integração com o agente local.",
  });

  const jwtPayload = decodeJwtPayload(tokens.accessToken);

  useEffect(() => {
    if (!tokens.accessToken) {
      window.location.href = "/login";
      return;
    }

    void probeBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmBackendReachability(): Promise<boolean> {
    try {
      const res = await fetch(apiUrl("/api/metrics/frontend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric: "dashboard_probe",
          value: 1,
          tags: { path: "/dashboard", source: "web-dashboard" },
        }),
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  async function probeBackend() {
    if (!tokens.accessToken) {
      setProbe({
        state: "error",
        title: "Sessão não encontrada",
        message: "Faça login novamente para acessar a dashboard.",
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setProbe({
      state: "loading",
      title: "Consultando backend Spring",
      message: `Tentando buscar ${AGENT_STATUS_ENDPOINT} com o token da sessão.`,
      checkedAt: new Date().toISOString(),
    });

    try {
      const res = await fetch(apiUrl(AGENT_STATUS_ENDPOINT), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: "application/json",
        },
      });

      const data = await safeJson(res);
      const payloadPreview = previewPayload(data);
      const checkedAt = new Date().toISOString();

      if (res.ok) {
        setProbe({
          state: "online",
          title: "Integração online",
          message:
            "Backend respondeu com sucesso ao endpoint de status do agente. A dashboard já pode consumir dados reais.",
          statusCode: res.status,
          payloadPreview,
          checkedAt,
        });
        return;
      }

      if (res.status === 404) {
        const backendOnline = await confirmBackendReachability();

        setProbe({
          state: backendOnline ? "pending" : "error",
          title: backendOnline
            ? "Backend online, endpoint pendente"
            : "Endpoint do agente não encontrado",
          message: backendOnline
            ? `O Spring está acessível, mas ${AGENT_STATUS_ENDPOINT} ainda não foi implementado. Quando você expuser esse endpoint (WS/TLS -> REST do agente), a dashboard passa a mostrar o status real.`
            : `O backend não respondeu ao teste alternativo de conectividade. Verifique se a API Spring está rodando em ${API_BASE_URL}.`,
          statusCode: res.status,
          payloadPreview,
          checkedAt,
        });
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setProbe({
          state: "error",
          title: "Token rejeitado",
          message:
            "O backend recusou o token da sessão. Faça login novamente ou ajuste a autenticação do endpoint protegido.",
          statusCode: res.status,
          payloadPreview,
          checkedAt,
        });
        return;
      }

      setProbe({
        state: "error",
        title: "Resposta inesperada do backend",
        message:
          "A comunicação com o backend aconteceu, mas o endpoint retornou um status não esperado para a dashboard.",
        statusCode: res.status,
        payloadPreview,
        checkedAt,
      });
    } catch (err) {
      setProbe({
        state: "error",
        title: "Falha de conexão",
        message:
          err instanceof TypeError
            ? `Não foi possível conectar ao backend em ${API_BASE_URL}. Verifique se o Spring Boot está rodando e com CORS liberado para o frontend.`
            : err instanceof Error
              ? err.message
              : "Erro inesperado ao consultar o backend.",
        checkedAt: new Date().toISOString(),
      });
    }
  }

  function handleLogout() {
    localStorage.removeItem("keeply_access_token");
    localStorage.removeItem("keeply_refresh_token");
    setTokens(getStoredTokens());
    window.location.href = "/login";
  }

  const sessionEmail =
    typeof jwtPayload?.email === "string" ? jwtPayload.email : "Não disponível";
  const sessionUserId =
    typeof jwtPayload?.sub === "string" ? jwtPayload.sub : "Não disponível";
  const tokenExpiresAt = formatUnixDate(jwtPayload?.exp);
  const sessionName = extractUserDisplayName(jwtPayload, sessionEmail);

  return (
    <div style={styles.page}>
      <div style={styles.navbarDashboardWrap}>
        <NavbarDashboard
          userName={sessionName}
          userEmail={sessionEmail}
          onLogout={handleLogout}
        />
      </div>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>
              Painel pós-login para integrar o frontend com o backend Spring e,
              em seguida, acompanhar a ponte segura com o agente local.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                ...(probe.state === "loading" ? styles.buttonDisabled : {}),
              }}
              onClick={() => void probeBackend()}
              disabled={probe.state === "loading"}
            >
              {probe.state === "loading" ? "Verificando..." : "Atualizar status"}
            </button>

          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.grid} id="inicio">
              <article style={styles.card} id="perfil">
                <div style={styles.cardLabel}>Sessão</div>
                <h2 style={styles.cardTitle}>Autenticação do usuário</h2>
                <div style={styles.kvList}>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>Access token</span>
                    <span style={styles.kvValue}>
                      {tokens.accessToken ? "Presente" : "Ausente"}
                    </span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>Refresh token</span>
                    <span style={styles.kvValue}>
                      {tokens.refreshToken ? "Presente" : "Ausente"}
                    </span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>E-mail (JWT)</span>
                    <span style={styles.kvValue}>{sessionEmail}</span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>User ID (JWT)</span>
                    <span style={styles.kvValue}>{sessionUserId}</span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>Expira em</span>
                    <span style={styles.kvValue}>{tokenExpiresAt}</span>
                  </div>
                </div>
              </article>

              <article style={styles.card} id="agentes">
                <div style={styles.cardLabel}>Backend Spring</div>
                <h2 style={styles.cardTitle}>Status da integração</h2>
                <div style={styles.statusBox}>
                  <span
                    style={{
                      ...styles.statusDot,
                      ...(probe.state === "online"
                        ? styles.dotOnline
                        : probe.state === "loading"
                          ? styles.dotLoading
                          : probe.state === "pending"
                            ? styles.dotPending
                            : probe.state === "error"
                              ? styles.dotError
                              : styles.dotIdle),
                    }}
                  />
                  <div>
                    <div style={styles.statusTitle}>{probe.title}</div>
                    <p style={styles.statusMessage}>{probe.message}</p>
                  </div>
                </div>

                <div style={styles.kvList}>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>API base</span>
                    <span style={styles.kvValue}>{API_BASE_URL}</span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>Endpoint esperado</span>
                    <span style={styles.kvValue}>{AGENT_STATUS_ENDPOINT}</span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>HTTP status</span>
                    <span style={styles.kvValue}>
                      {probe.statusCode ? String(probe.statusCode) : "-"}
                    </span>
                  </div>
                  <div style={styles.kvRow}>
                    <span style={styles.kvKey}>Última verificação</span>
                    <span style={styles.kvValue}>
                      {formatCheckedAt(probe.checkedAt)}
                    </span>
                  </div>
                </div>

                {probe.payloadPreview && (
                  <pre style={styles.codeBlock}>{probe.payloadPreview}</pre>
                )}
              </article>

              <article style={styles.card} id="configuracoes">
                <div style={styles.cardLabel}>Canal Seguro</div>
                <h2 style={styles.cardTitle}>WebSocket do agente local (TLS)</h2>
                <p style={styles.paragraph}>
                  A dashboard foi preparada para refletir o estado da ponte
                  segura entre o Spring e o agente local via WS/WSS com SSL/TLS.
                  Quando o backend expor o endpoint de status, este painel pode
                  mostrar:
                </p>
                <ul style={styles.list}>
                  <li>Estado do handshake TLS e certificado em uso</li>
                  <li>Último heartbeat do agente</li>
                  <li>Latência da conexão WS</li>
                  <li>Fila de comandos e respostas</li>
                </ul>
              </article>

              <article style={styles.card} id="backups">
                <div style={styles.cardLabel}>Backups</div>
                <h2 style={styles.cardTitle}>Operações mediadas pelo backend</h2>
                <p style={styles.paragraph}>
                  O fluxo esperado é: frontend autenticado → backend Spring →
                  canal WS/TLS → agente local → APIs REST internas do agente.
                </p>
                <p style={styles.paragraph}>
                  Sugestão de endpoints para alimentar a área de backups e jobs
                  na dashboard:
                </p>
                <pre style={styles.codeBlock}>
{`GET  /api/agent/status
GET  /api/agent/jobs
POST /api/agent/sync
GET  /api/agent/rest-endpoints`}
                </pre>
              </article>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 12% 8%, rgba(59,130,246,0.12) 0%, transparent 38%), radial-gradient(circle at 90% 18%, rgba(16,185,129,0.09) 0%, transparent 44%), linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    position: "relative",
  },

  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "18px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "clamp(1.55rem, 3vw, 2.25rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
  },

  subtitle: {
    margin: "10px 0 0",
    maxWidth: 760,
    color: "#475569",
    lineHeight: 1.55,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  primaryButton: {
    appearance: "none",
    border: "1px solid rgba(15,23,42,0.08)",
    background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
    color: "#ffffff",
    fontWeight: 700,
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(37,99,235,0.18)",
  },

  secondaryButton: {
    appearance: "none",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(255,255,255,0.9)",
    color: "#0f172a",
    fontWeight: 700,
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(15,23,42,0.04)",
  },

  buttonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "10px 20px 34px",
  },

  navbarDashboardWrap: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    maxWidth: 1200,
    margin: "0 auto",
    padding: "12px 20px 10px",
    background:
      "linear-gradient(180deg, rgba(248,251,255,0.98) 0%, rgba(248,251,255,0.9) 72%, rgba(248,251,255,0) 100%)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
    alignItems: "start",
    scrollMarginTop: 104,
  },

  card: {
    background: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 18px 36px rgba(15,23,42,0.05)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    scrollMarginTop: 104,
  },

  cardLabel: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid rgba(37,99,235,0.12)",
    background: "rgba(37,99,235,0.06)",
    color: "#1e3a8a",
    fontWeight: 700,
    fontSize: "0.75rem",
    padding: "6px 10px",
    marginBottom: 12,
  },

  cardTitle: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },

  statusBox: {
    marginTop: 12,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    background: "rgba(248,250,252,0.9)",
    border: "1px solid rgba(148,163,184,0.14)",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    marginTop: 5,
    flexShrink: 0,
  },

  dotIdle: {
    background: "#94a3b8",
    boxShadow: "0 0 0 4px rgba(148,163,184,0.15)",
  },

  dotLoading: {
    background: "#2563eb",
    boxShadow: "0 0 0 4px rgba(37,99,235,0.15)",
  },

  dotOnline: {
    background: "#059669",
    boxShadow: "0 0 0 4px rgba(5,150,105,0.16)",
  },

  dotPending: {
    background: "#d97706",
    boxShadow: "0 0 0 4px rgba(217,119,6,0.16)",
  },

  dotError: {
    background: "#dc2626",
    boxShadow: "0 0 0 4px rgba(220,38,38,0.14)",
  },

  statusTitle: {
    fontWeight: 800,
    color: "#0f172a",
    fontSize: "0.95rem",
    marginBottom: 4,
  },

  statusMessage: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.45,
    fontSize: "0.92rem",
  },

  kvList: {
    marginTop: 14,
    display: "grid",
    gap: 10,
  },

  kvRow: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 145px) 1fr",
    gap: 10,
    alignItems: "start",
  },

  kvKey: {
    color: "#64748b",
    fontWeight: 700,
    fontSize: "0.84rem",
  },

  kvValue: {
    color: "#0f172a",
    fontSize: "0.9rem",
    overflowWrap: "anywhere",
  },

  paragraph: {
    margin: "12px 0 0",
    color: "#475569",
    lineHeight: 1.55,
    fontSize: "0.95rem",
  },

  list: {
    margin: "12px 0 0",
    paddingLeft: 18,
    color: "#334155",
    lineHeight: 1.6,
  },

  codeBlock: {
    margin: "14px 0 0",
    padding: 12,
    borderRadius: 14,
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: "0.8rem",
    lineHeight: 1.45,
    overflowX: "auto",
    border: "1px solid rgba(15,23,42,0.12)",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
};
