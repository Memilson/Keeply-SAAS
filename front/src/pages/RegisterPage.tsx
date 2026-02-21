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

type RegisterForm = {
  fullName: string;
  cpf: string;
  phoneNumber: string;
  birthDate: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    cpf: "",
    phoneNumber: "",
    birthDate: "",
    email: "",
    password: "",
    acceptedTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.acceptedTerms) {
      setErrorMsg("Você precisa aceitar os termos.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          cpf: onlyDigits(form.cpf),
          phoneNumber: onlyDigits(form.phoneNumber),
          birthDate: form.birthDate,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          acceptedTerms: form.acceptedTerms,
          acceptedPrivacyPolicy: form.acceptedTerms,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        let message = "Falha no cadastro";

        if (data && typeof data === "object") {
          if ("fields" in data && data.fields && typeof data.fields === "object") {
            const firstFieldError = Object.values(
              data.fields as Record<string, string>
            ).find(Boolean);
            if (firstFieldError) message = String(firstFieldError);
          }

          if (
            message === "Falha no cadastro" &&
            "message" in data &&
            data.message
          ) {
            message = String(data.message);
          }
        }

        throw new Error(message);
      }

      setSuccessMsg(
        "Cadastro realizado. Verifique seu e-mail para confirmar a conta (se a confirmação estiver ativada no Supabase)."
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
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
        <div style={styles.glowA} />
        <div style={styles.glowB} />
        <div style={styles.glowC} />

        <section style={styles.container}>
          <div style={styles.layout}>
            {/* Painel lateral */}
            <aside style={styles.sidePanel}>
              <h1 style={styles.sideTitle}>
                Crie sua conta e
                <br />
                <span style={styles.blueText}>proteja seus dados</span>
              </h1>

              <p style={styles.sideSubtitle}>
                Comece com uma experiência amigável e sem burocracia. A Keeply
                foi feita para quem quer backup real sem dor de cabeça.
              </p>

            </aside>

            {/* Formulário */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.title}>Criar conta</h2>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <label style={{ ...styles.label, ...styles.fieldFull }}>
                  Nome completo
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="Seu nome completo"
                    required
                  />
                </label>

                <label style={styles.label}>
                  CPF
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, cpf: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="Somente números ou formatado"
                    required
                  />
                </label>

                <label style={styles.label}>
                  Telefone
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="DDD + número"
                    required
                  />
                </label>

                <label style={styles.label}>
                  Data de nascimento
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, birthDate: e.target.value }))
                    }
                    style={styles.input}
                    required
                  />
                </label>

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

                <label style={{ ...styles.label, ...styles.fieldFull }}>
                  Senha
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="Mínimo de 8 caracteres"
                    minLength={8}
                    required
                  />
                </label>

                <label style={{ ...styles.checkboxRow, ...styles.fieldFull }}>
                  <input
                    type="checkbox"
                    checked={form.acceptedTerms}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        acceptedTerms: e.target.checked,
                      }))
                    }
                    style={styles.checkbox}
                  />
                  <span>
                    Aceito os termos de uso e a política de privacidade.
                  </span>
                </label>

                {(errorMsg || successMsg) && (
                  <div style={{ ...styles.fieldFull, display: "grid", gap: 10 }}>
                    {errorMsg && <p style={styles.error}>{errorMsg}</p>}
                    {successMsg && <p style={styles.success}>{successMsg}</p>}
                  </div>
                )}

                <div style={{ ...styles.fieldFull, display: "grid", gap: 10 }}>
                  <button
                    type="submit"
                    style={{
                      ...styles.button,
                      ...(loading ? styles.buttonDisabled : {}),
                    }}
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Criar conta"}
                  </button>

                  <p style={styles.helperText}>
                    Já tem conta?{" "}
                    <a href="/login" style={styles.link}>
                      Entrar
                    </a>
                  </p>
                  <p style={styles.helperText}>
                    <a href="/" style={styles.linkMuted}>
                      ← Voltar para o menu principal
                    </a>
                  </p>
                </div>
              </form>
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
      "radial-gradient(circle at 10% 12%, rgba(59,130,246,0.12) 0%, transparent 35%), radial-gradient(circle at 88% 18%, rgba(37,99,235,0.10) 0%, transparent 42%), linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%)",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  main: {
    position: "relative",
    overflow: "hidden",
    padding: "26px 16px 40px",
  },

  glowA: {
    position: "absolute",
    top: 80,
    left: -100,
    width: 320,
    height: 320,
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
    filter: "blur(22px)",
    pointerEvents: "none",
  },

  glowC: {
    position: "absolute",
    bottom: -140,
    left: "38%",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(147,197,253,0.16)",
    filter: "blur(16px)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1220,
    margin: "0 auto",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.05fr",
    gap: 20,
    alignItems: "start",
  },

  sidePanel: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    position: "sticky",
    top: 90,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
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

  sideTitle: {
    margin: 0,
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
    fontSize: "clamp(1.7rem, 3.8vw, 2.7rem)",
    color: "#0f172a",
  },

  blueText: {
    color: "#2563eb",
  },

  sideSubtitle: {
    margin: "12px 0 0",
    color: "#475569",
    lineHeight: 1.65,
    fontSize: "0.98rem",
  },

  sideList: {
    display: "grid",
    gap: 12,
    marginTop: 20,
  },

  sideItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
  },

  sideIcon: {
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

  sideItemTitle: {
    display: "block",
    color: "#0f172a",
    fontSize: "0.94rem",
    marginBottom: 4,
  },

  sideItemText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.45,
    fontSize: "0.87rem",
  },

  card: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.96) 100%)",
    borderRadius: 22,
    border: "1px solid rgba(148,163,184,0.14)",
    padding: 22,
    boxShadow: "0 22px 46px rgba(15,23,42,0.08)",
    overflow: "hidden",
  },

  cardHeader: {
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
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  fieldFull: {
    gridColumn: "1 / -1",
  },

  label: {
    display: "grid",
    gap: 7,
    color: "#334155",
    fontWeight: 700,
    fontSize: "0.9rem",
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

  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    color: "#475569",
    fontSize: "0.92rem",
    lineHeight: 1.45,
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 14,
    padding: "12px 12px",
  },

  checkbox: {
    marginTop: 2,
    width: 16,
    height: 16,
    accentColor: "#2563eb",
    flexShrink: 0,
  },

  button: {
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

  helperText: {
    margin: 0,
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
