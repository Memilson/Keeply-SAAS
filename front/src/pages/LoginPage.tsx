import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config";

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          (data &&
            typeof data === "object" &&
            "message" in data &&
            String(data.message)) ||
            "Falha no login"
        );
      }

      if (data?.access_token) {
        localStorage.setItem("keeply_access_token", data.access_token);
      }
      if (data?.refresh_token) {
        localStorage.setItem("keeply_refresh_token", data.refresh_token);
      }

      setSuccessMsg("Login realizado com sucesso.");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err) {
      if (err instanceof TypeError) {
        setErrorMsg(
          "Não foi possível conectar ao backend. Verifique se a API está rodando em http://localhost:8081."
        );
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  const goLogin = () => {
    window.location.href = "/login";
  };

  const goRegister = () => {
    window.location.href = "/register";
  };

  return (
    <div style={styles.page}>
      <Navbar onLoginClick={goLogin} onRegisterClick={goRegister} />

      <main style={styles.main}>
        {/* fundos decorativos */}
        <div style={styles.glowA} />
        <div style={styles.glowB} />
        <div style={styles.glowC} />

        <section style={styles.container}>
          <div style={styles.authGrid}>
            {/* lado esquerdo / branding */}
            <div style={styles.visualPanel}>
              <h1 style={styles.heroTitle}>
                Entrar na sua conta
                <br />
                <span style={styles.blueText}>sem complicação</span>
              </h1>

              <p style={styles.heroSubtitle}>
                Acesse seus backups, acompanhe o status e mantenha seus dados
                protegidos com uma experiência simples e direta.
              </p>

            </div>

            {/* lado direito / formulário */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.title}>Entrar</h2>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.label}>
                  E-mail
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="voce@exemplo.com"
                    required
                  />
                </label>

                <label style={styles.label}>
                  Senha
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="Sua senha"
                    required
                  />
                </label>

                {errorMsg && <p style={styles.error}>{errorMsg}</p>}
                {successMsg && <p style={styles.success}>{successMsg}</p>}

                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    ...(loading ? styles.buttonDisabled : {}),
                  }}
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div style={styles.footerArea}>
                <p style={styles.footerText}>
                  Não tem conta?{" "}
                  <a href="/register" style={styles.link}>
                    Cadastre-se
                  </a>
                </p>
                <p style={styles.footerText}>
                  <a href="/" style={styles.linkMuted}>
                    ← Voltar para o menu principal
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 15% 10%, rgba(59,130,246,0.12) 0%, transparent 35%), radial-gradient(circle at 85% 20%, rgba(37,99,235,0.10) 0%, transparent 40%), linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%)",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  main: {
    position: "relative",
    overflow: "hidden",
    padding: "28px 16px 40px",
  },

  glowA: {
    position: "absolute",
    top: 40,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(59,130,246,0.14)",
    filter: "blur(18px)",
    pointerEvents: "none",
  },

  glowB: {
    position: "absolute",
    top: 120,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(37,99,235,0.12)",
    filter: "blur(20px)",
    pointerEvents: "none",
  },

  glowC: {
    position: "absolute",
    bottom: -120,
    left: "35%",
    width: 340,
    height: 340,
    borderRadius: "50%",
    background: "rgba(147,197,253,0.15)",
    filter: "blur(14px)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1180,
    margin: "0 auto",
  },

  authGrid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 20,
    alignItems: "stretch",
  },

  visualPanel: {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  visualBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#1e3a8a",
    fontWeight: 700,
    fontSize: "0.83rem",
    padding: "8px 12px",
    borderRadius: 999,
    boxShadow: "0 8px 18px rgba(37,99,235,0.08)",
    marginBottom: 16,
  },

  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#2563eb",
    boxShadow: "0 0 0 4px rgba(37,99,235,0.15)",
  },

  heroTitle: {
    margin: 0,
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
    fontSize: "clamp(1.8rem, 4vw, 3rem)",
    color: "#0f172a",
  },

  blueText: {
    color: "#2563eb",
  },

  heroSubtitle: {
    margin: "12px 0 0",
    color: "#475569",
    lineHeight: 1.65,
    fontSize: "1rem",
    maxWidth: 520,
  },

  miniCards: {
    display: "grid",
    gap: 12,
    marginTop: 20,
  },

  miniCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
  },

  miniIcon: {
    width: "auto",
    height: "auto",
    borderRadius: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    fontSize: "1.1rem",
    flexShrink: 0,
  },

  miniTitle: {
    display: "block",
    color: "#0f172a",
    fontSize: "0.95rem",
    marginBottom: 4,
  },

  miniText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.5,
    fontSize: "0.88rem",
  },

  card: {
    position: "relative",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.96) 100%)",
    borderRadius: 22,
    border: "1px solid rgba(148,163,184,0.14)",
    padding: 22,
    boxShadow: "0 22px 46px rgba(15,23,42,0.08)",
    overflow: "hidden",
  },

  cardHeader: {
    position: "relative",
    zIndex: 1,
    marginBottom: 14,
  },

  title: {
    margin: 0,
    fontSize: "1.65rem",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    lineHeight: 1.55,
    fontSize: "0.94rem",
  },

  form: {
    display: "grid",
    gap: 14,
    position: "relative",
    zIndex: 1,
  },

  label: {
    display: "grid",
    gap: 7,
    color: "#334155",
    fontWeight: 700,
    fontSize: "0.92rem",
  },

  input: {
    border: "1px solid #dbe3f0",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: "0.95rem",
    outline: "none",
    background: "rgba(255,255,255,0.95)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    color: "#0f172a",
  },

  button: {
    marginTop: 2,
    border: "none",
    borderRadius: 14,
    padding: "13px 16px",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    color: "#fff",
    boxShadow: "0 14px 28px rgba(37,99,235,0.26)",
    transition: "all 180ms ease",
  },

  buttonDisabled: {
    opacity: 0.75,
    cursor: "not-allowed",
    boxShadow: "0 8px 16px rgba(37,99,235,0.15)",
  },

  error: {
    margin: 0,
    color: "#b91c1c",
    background: "rgba(254,226,226,0.8)",
    border: "1px solid rgba(239,68,68,0.16)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: "0.9rem",
    lineHeight: 1.45,
  },

  success: {
    margin: 0,
    color: "#166534",
    background: "rgba(220,252,231,0.8)",
    border: "1px solid rgba(34,197,94,0.16)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: "0.9rem",
    lineHeight: 1.45,
  },

  footerArea: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid rgba(148,163,184,0.14)",
  },

  footerText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "0.92rem",
  },

  link: {
    color: "#2563eb",
    fontWeight: 700,
    textDecoration: "none",
  },

  linkMuted: {
    color: "#475569",
    textDecoration: "none",
    fontWeight: 600,
  },
};
