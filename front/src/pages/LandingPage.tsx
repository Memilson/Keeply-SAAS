import type { CSSProperties } from "react";
import Navbar from "../components/Navbar";
import LoginButton from "../components/LoginButton";
import RegisterButton from "../components/RegisterButton";

// 👉 Coloque essas imagens em src/assets/landing/
// (pode usar suas fotos royalty-free e renomear igual abaixo)
import heroImage from "../assets/landing/1.webp";
import person1 from "../assets/landing/1.webp";
import person2 from "../assets/landing/2.webp";
import person3 from "../assets/landing/3.webp";

type Feature = {
  icon: string;
  title: string;
  description: string;
};

type Testimonial = {
  name: string;
  role: string;
  text: string;
  image: string;
};

const features: Feature[] = [
  {
    icon: "☁️",
    title: "Backup automático",
    description:
      "Proteja seus arquivos sem rotina manual. A Keeply faz o trabalho pesado por você.",
  },
  {
    icon: "♻️",
    title: "Restauração simples",
    description:
      "Recupere dados importantes em poucos cliques, sem burocracia e sem dor de cabeça.",
  },
  {
    icon: "🛡️",
    title: "Segurança e redundância",
    description:
      "Se algo acontecer com seu dispositivo, seus dados continuam protegidos e acessíveis.",
  },
];

const testimonials: Testimonial[] = [
  {
    name: "Carlos",
    role: "Uso pessoal",
    text: "Queria algo simples para não perder meus arquivos e fotos. A Keeply me trouxe tranquilidade sem complicação.",
    image: person1,
  },
  {
    name: "Rafael",
    role: "Pequeno negócio",
    text: "Perdi arquivos uma vez e não quis correr esse risco de novo. Hoje uso Keeply no dia a dia.",
    image: person2,
  },
  {
    name: "Equipe",
    role: "Uso compartilhado",
    text: "A praticidade ajudou bastante. Backup funcionando sem precisar virar especialista.",
    image: person3,
  },
];

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  return (
    <div style={styles.page}>
      <Navbar onLoginClick={handleLogin} onRegisterClick={handleRegister} />

      {/* HERO */}
      <section id="inicio" style={styles.heroSection}>
        {/* fundos decorativos */}
        <div style={styles.heroGlowLeft} />
        <div style={styles.heroGlowRight} />
        <div style={styles.heroBlobTop} />
        <div style={styles.heroBlobBottom} />

        <div style={styles.container}>
          <div style={styles.heroGrid}>
            {/* Texto */}
            <div style={styles.heroContent}>
              <h1 style={styles.heroTitle}>
                <span style={styles.blueText}>Backups leves</span>
                <br />
                e sem burocracia
              </h1>

              <p style={styles.heroSubtitle}>
                Guarde seus dados com segurança e redundância, de forma simples.
                A Keeply foi feita para o público final que só quer uma coisa:
                não perder arquivos importantes quando der ruim.
              </p>

              <div style={styles.heroActions}>
                <RegisterButton
                  label="Ainda não estou Protegido!"
                  onClick={handleRegister}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    minWidth: 180,
                    fontSize: "1rem",
                  }}
                />
                <LoginButton
                  label="Entrar"
                  onClick={handleLogin}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    minWidth: 130,
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={styles.heroTrustRow}>
                <div style={styles.trustItem}>✅ Setup simples</div>
                <div style={styles.trustItem}>✅ Restauração rápida</div>
                <div style={styles.trustItem}>✅ Sem complicação</div>
              </div>
            </div>

            {/* Visual */}
            <div style={styles.heroVisualWrap}>
              <div style={styles.heroVisualCard}>
                <img
                  src={heroImage}
                  alt="Pessoa usando notebook com interface Keeply"
                  style={styles.heroImage}
                />

                {/* badges flutuantes */}
                <div style={{ ...styles.floatingBadge, top: 30, right: 18 }}>
                  <span style={styles.floatingIcon}>🛡️</span>
                  <span>Proteção ativa</span>
                </div>

                <div style={{ ...styles.floatingBadge, bottom: 28, right: 24 }}>
                  <span style={styles.floatingIcon}>✔</span>
                  <span>Restauração fácil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" style={styles.section}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <p style={styles.kicker}>POR QUE Keeply</p>
            <h2 style={styles.sectionTitle}>
              Feita para proteger o que importa, sem virar um curso de TI
            </h2>
            <p style={styles.sectionSubtitle}>
              Uma experiência amigável para quem quer backup funcionando de
              verdade — sem painéis confusos, sem configuração infinita.
            </p>
          </div>

          <div style={styles.featuresGrid}>
            {features.map((feature) => (
              <div key={feature.title} style={styles.featureCard}>
                <div style={styles.featureIconCircle}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" style={{ ...styles.section, paddingTop: 8 }}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <p style={styles.kicker}>QUEM USA</p>
            <h2 style={styles.sectionTitle}>
              Pessoas reais que só queriam parar de perder dados
            </h2>
            <p style={styles.sectionSubtitle}>
              Pequenos negócios, autônomos e home office usando uma solução leve
              e confiável.
            </p>
          </div>

          <div style={styles.testimonialsGrid}>
            {testimonials.map((item) => (
              <article key={item.name} style={styles.testimonialCard}>
                <div style={styles.testimonialImageWrap}>
                  <img
                    src={item.image}
                    alt={`Foto de ${item.name}`}
                    style={styles.testimonialImage}
                  />
                </div>

                <div style={styles.testimonialBody}>
                  <div style={styles.testimonialUserRow}>
                    <div style={styles.avatarMini}>
                      {item.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h4 style={styles.testimonialName}>{item.name}</h4>
                      <p style={styles.testimonialRole}>{item.role}</p>
                    </div>
                  </div>

                  <p style={styles.testimonialText}>“{item.text}”</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <div style={styles.ctaCard}>
            <div style={styles.ctaGlow1} />
            <div style={styles.ctaGlow2} />

            <div style={styles.ctaContent}>
              <p style={styles.kickerLight}>COMECE HOJE</p>
              <h2 style={styles.ctaTitle}>
                Mantenha seus arquivos seguros com a Keeply
              </h2>
              <p style={styles.ctaSubtitle}>
                Backup leve, simples e pensado para quem precisa de proteção
                real sem complicação.
              </p>

              <div style={styles.ctaActions}>
                <RegisterButton
                  label="Ainda não estou Protegido!"
                  onClick={handleRegister}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    minWidth: 200,
                    fontSize: "1rem",
                    boxShadow: "0 16px 30px rgba(59,130,246,0.28)",
                  }}
                />
                <LoginButton
                  label="Já tenho conta"
                  onClick={handleLogin}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    minWidth: 170,
                    fontSize: "1rem",
                    background: "rgba(255,255,255,0.85)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contato" style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerGrid}>
            <div>
              <div style={styles.footerBrandRow}>
                <img
                  src="/keeply-cloud-hero.png"
                  alt="Keeply"
                  style={styles.footerLogoImage}
                />
                <span style={styles.footerBrand}>Keeply</span>
              </div>
              <p style={styles.footerText}>
                Plataforma leve de backup para o público final. Proteção real,
                experiência simples e foco no que importa: seus dados.
              </p>
            </div>

            <div>
              <h4 style={styles.footerHeading}>Produto</h4>
              <ul style={styles.footerList}>
                <li>Backup automático</li>
                <li>Restauração</li>
                <li>Segurança</li>
              </ul>
            </div>

            <div>
              <h4 style={styles.footerHeading}>Legal</h4>
              <ul style={styles.footerList}>
                <li>Termos de uso</li>
                <li>Privacidade</li>
                <li>Suporte</li>
              </ul>
            </div>
          </div>

          <div style={styles.footerBottom}>
            © {new Date().getFullYear()} Keeply. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fbff",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 20px",
  },

  heroSection: {
    position: "relative",
    overflow: "hidden",
    padding: "34px 0 58px",
    background:
      "radial-gradient(circle at 18% 20%, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.03) 24%, transparent 50%), radial-gradient(circle at 88% 18%, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0.03) 26%, transparent 55%), linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%)",
  },

  heroGlowLeft: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: "50%",
    top: -80,
    left: -120,
    background: "rgba(59,130,246,0.10)",
    filter: "blur(12px)",
    pointerEvents: "none",
  },

  heroGlowRight: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    top: 40,
    right: -140,
    background: "rgba(37,99,235,0.08)",
    filter: "blur(18px)",
    pointerEvents: "none",
  },

  heroBlobTop: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: "50%",
    top: 90,
    right: "35%",
    background: "rgba(255,255,255,0.65)",
    filter: "blur(5px)",
    pointerEvents: "none",
  },

  heroBlobBottom: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: "50%",
    bottom: -120,
    left: "42%",
    background: "rgba(147, 197, 253, 0.18)",
    filter: "blur(8px)",
    pointerEvents: "none",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 24,
    alignItems: "center",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    paddingTop: 18,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37, 99, 235, 0.12)",
    color: "#1e3a8a",
    fontWeight: 700,
    fontSize: "0.85rem",
    padding: "8px 12px",
    borderRadius: 999,
    boxShadow: "0 8px 18px rgba(37,99,235,0.08)",
    marginBottom: 18,
  },

  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#2563eb",
    boxShadow: "0 0 0 4px rgba(37,99,235,0.15)",
  },

  heroTitle: {
    margin: "0 0 14px",
    fontWeight: 900,
    lineHeight: 1.04,
    letterSpacing: "-0.03em",
    fontSize: "clamp(2.2rem, 5vw, 3.9rem)",
    color: "#0f172a",
  },

  blueText: {
    color: "#2563eb",
  },

  heroSubtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "1.05rem",
    lineHeight: 1.65,
    maxWidth: 580,
  },

  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap",
  },

  heroTrustRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },

  trustItem: {
    background: "transparent",
    border: "none",
    color: "#334155",
    borderRadius: 0,
    padding: 0,
    fontSize: "0.88rem",
    fontWeight: 600,
  },

  heroVisualWrap: {
    position: "relative",
    zIndex: 2,
  },

  heroVisualCard: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.96) 100%)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 24px 48px rgba(15,23,42,0.10)",
    minHeight: 420,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  heroImage: {
    width: "100%",
    height: "100%",
    maxHeight: 460,
    objectFit: "cover",
    borderRadius: 18,
    display: "block",
  },

  floatingBadge: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: 999,
    padding: "8px 12px",
    color: "#1f2937",
    fontWeight: 700,
    fontSize: "0.8rem",
    boxShadow: "0 10px 22px rgba(15,23,42,0.09)",
  },

  floatingIcon: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "0.8rem",
  },

  section: {
    padding: "52px 0",
  },

  sectionHeader: {
    textAlign: "center",
    maxWidth: 850,
    margin: "0 auto 26px",
  },

  kicker: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.12em",
    fontSize: "0.78rem",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontWeight: 800,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
    fontSize: "clamp(1.6rem, 3vw, 2.35rem)",
  },

  sectionSubtitle: {
    margin: "12px auto 0",
    color: "#64748b",
    lineHeight: 1.7,
    fontSize: "1rem",
    maxWidth: 730,
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
    marginTop: 24,
  },

  featureCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 20,
    padding: "22px 18px",
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
  },

  featureIconCircle: {
    width: "auto",
    height: "auto",
    borderRadius: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    fontSize: "1.25rem",
    marginBottom: 12,
  },

  featureTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: "1.1rem",
  },

  featureDescription: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.65,
    fontSize: "0.95rem",
  },

  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
    marginTop: 20,
  },

  testimonialCard: {
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid rgba(148,163,184,0.14)",
    overflow: "hidden",
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
  },

  testimonialImageWrap: {
    width: "100%",
    height: 210,
    background: "#eff6ff",
  },

  testimonialImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  testimonialBody: {
    padding: "16px 16px 18px",
  },

  testimonialUserRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    color: "#1e3a8a",
    fontWeight: 800,
    fontSize: "0.8rem",
    flexShrink: 0,
  },

  testimonialName: {
    margin: 0,
    color: "#0f172a",
    fontWeight: 800,
    fontSize: "1rem",
  },

  testimonialRole: {
    margin: "2px 0 0",
    color: "#64748b",
    fontSize: "0.88rem",
  },

  testimonialText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6,
    fontSize: "0.95rem",
  },

  ctaSection: {
    padding: "26px 0 56px",
  },

  ctaCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 26,
    border: "1px solid rgba(148,163,184,0.14)",
    background:
      "linear-gradient(180deg, rgba(239,246,255,0.95) 0%, rgba(248,251,255,0.95) 100%)",
    boxShadow: "0 20px 42px rgba(15,23,42,0.06)",
    padding: "34px 24px",
  },

  ctaGlow1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(59,130,246,0.14)",
    top: -90,
    left: -60,
    filter: "blur(10px)",
    pointerEvents: "none",
  },

  ctaGlow2: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(37,99,235,0.10)",
    bottom: -90,
    right: -50,
    filter: "blur(14px)",
    pointerEvents: "none",
  },

  ctaContent: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    maxWidth: 820,
    margin: "0 auto",
  },

  kickerLight: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.12em",
    fontSize: "0.78rem",
  },

  ctaTitle: {
    margin: "10px 0 10px",
    color: "#0f172a",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
    fontSize: "clamp(1.7rem, 3.2vw, 2.65rem)",
  },

  ctaSubtitle: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
    fontSize: "1rem",
  },

  ctaActions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
  },

  footer: {
    background: "#ffffff",
    borderTop: "1px solid rgba(148,163,184,0.14)",
    padding: "34px 0 18px",
  },

  footerGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.5fr 0.5fr",
    gap: 20,
    alignItems: "start",
  },

  footerBrandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  footerLogoImage: {
    width: 20,
    height: 20,
    display: "block",
    objectFit: "contain",
  },

  footerBrand: {
    fontWeight: 900,
    fontSize: "1.1rem",
    color: "#0f172a",
  },

  footerText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
    maxWidth: 520,
    fontSize: "0.95rem",
  },

  footerHeading: {
    margin: "2px 0 10px",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: "0.95rem",
  },

  footerList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    color: "#64748b",
    display: "grid",
    gap: 8,
    fontSize: "0.92rem",
  },

  footerBottom: {
    marginTop: 22,
    paddingTop: 14,
    borderTop: "1px solid rgba(148,163,184,0.12)",
    color: "#94a3b8",
    fontSize: "0.86rem",
  },
};
