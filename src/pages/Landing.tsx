import * as React from "react";
import { Link } from "react-router-dom";

// ── Utility: animate on scroll ────────────────────────────────
function useReveal() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    // Also trigger if already in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setVisible(true); obs.disconnect(); }
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.65s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Animated code window ───────────────────────────────────────
const CODE_LINES = [
  { indent: 0, tokens: [{ t: "keyword", v: "function " }, { t: "fn", v: "calculateTotal" }, { t: "plain", v: "(items) {" }] },
  { indent: 1, tokens: [{ t: "keyword", v: "let " }, { t: "plain", v: "total = 0;" }] },
  { indent: 1, tokens: [{ t: "keyword", v: "for " }, { t: "plain", v: "(item " }, { t: "keyword", v: "of " }, { t: "plain", v: "items) {" }] },
  { indent: 2, tokens: [{ t: "plain", v: "total += item.price * item.qty;" }] },
  { indent: 1, tokens: [{ t: "plain", v: "}" }] },
  { indent: 1, tokens: [{ t: "keyword", v: "return " }, { t: "plain", v: "total;" }] },
  { indent: 0, tokens: [{ t: "plain", v: "}" }] },
];

const ISSUES = [
  { type: "warn", line: 2, msg: "Missing input validation — items could be null" },
  { type: "perf", line: 4, msg: "Consider Array.reduce() for cleaner aggregation" },
  { type: "ok", line: 6, msg: "Return value correctly typed" },
];

function CodeWindow() {
  const [issueIdx, setIssueIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIssueIdx(i => (i + 1) % ISSUES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const colorMap: Record<string, string> = {
    keyword: "#7dd3fc",
    fn: "#86efac",
    plain: "#e2e8f0",
  };
  const issueColor: Record<string, string> = {
    warn: "#fbbf24", perf: "#60a5fa", ok: "#4ade80",
  };
  const issueLabel: Record<string, string> = {
    warn: "⚠ Issue", perf: "⚡ Perf", ok: "✓ Good",
  };

  return (
    <div className="landing-code-window">
      {/* titlebar */}
      <div className="landing-code-titlebar">
        <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
        <span className="landing-code-filename">calculateTotal.js</span>
        <span className="landing-code-badge">AI Review</span>
      </div>
      {/* code */}
      <div className="landing-code-body">
        {CODE_LINES.map((line, li) => (
          <div key={li} className="landing-code-line">
            <span className="landing-code-ln">{li + 1}</span>
            <span style={{ paddingLeft: line.indent * 16 }}>
              {line.tokens.map((tok, ti) => (
                <span key={ti} style={{ color: colorMap[tok.t] }}>{tok.v}</span>
              ))}
            </span>
          </div>
        ))}
      </div>
      {/* feedback panel */}
      <div className="landing-code-feedback">
        {ISSUES.map((issue, i) => (
          <div
            key={i}
            className="landing-issue"
            style={{
              opacity: issueIdx === i ? 1 : 0.28,
              transform: issueIdx === i ? "translateX(0)" : "translateX(-6px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              borderLeft: `3px solid ${issueColor[issue.type]}`,
            }}
          >
            <span style={{ color: issueColor[issue.type], fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
              {issueLabel[issue.type]}
            </span>
            <span className="landing-issue-msg">Line {issue.line} — {issue.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="landing-feature-card">
        <div className="landing-feature-icon">{icon}</div>
        <h3 className="landing-feature-title">{title}</h3>
        <p className="landing-feature-desc">{desc}</p>
      </div>
    </Reveal>
  );
}

// ── Stat ───────────────────────────────────────────────────────
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <Reveal delay={delay} className="landing-stat">
      <div className="landing-stat-value">{value}</div>
      <div className="landing-stat-label">{label}</div>
    </Reveal>
  );
}

// ── Testimonial ────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: "CodeLensAI caught a critical SQL injection vulnerability I'd completely missed. It's now part of every PR review.", name: "Priya S.", role: "Senior Backend Engineer" },
  { quote: "The AI-powered feedback is eerily good. It understands context, not just syntax.", name: "Arjun M.", role: "Full-Stack Developer" },
  { quote: "Went from spending 20 min on code review to 3 minutes. The history & analytics alone are worth it.", name: "Riya K.", role: "Engineering Lead" },
];

// ── Main Page ──────────────────────────────────────────────────
export default function Landing() {
  const [activeTesti, setActiveTesti] = React.useState(0);
  const [navScrolled, setNavScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => setActiveTesti(i => (i + 1) % TESTIMONIALS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className={`landing-nav ${navScrolled ? "landing-nav--scrolled" : ""}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon" style={{ background: 'transparent', border: 'none' }}>
              <img src="/logo.png" alt="CodeLensAI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span>CodeLensAI</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#testimonials">Reviews</a>
          </div>
          <div className="landing-nav-actions ml-auto">
            <Link to="/login" className="landing-btn-ghost border border-[#7dd3fc]/40 text-[#1447e6]">Sign in</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-grid-bg" aria-hidden />
        <div className="landing-hero-glow" aria-hidden />

        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <Reveal delay={0}>
              <div className="landing-hero-badge">
                <span className="landing-pulse" />
                Powered by Advanced AI Models
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="landing-h1">
                Code review,<br />
                <span className="landing-h1-accent">elevated by AI.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="landing-hero-sub">
                Paste your code. Get back a full AI analysis — bugs, performance
                bottlenecks, security flaws, and best-practice violations.
                In under 10 seconds.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="landing-hero-cta">
                <Link to="/login" className="landing-btn-primary landing-btn-lg">
                  Start reviewing free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
                <a href="#features" className="landing-btn-ghost landing-btn-lg">See features</a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="landing-hero-meta">
                <span>✓ No credit card</span>
                <span>✓ Works in browser</span>
                <span>✓ 15+ languages</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="landing-hero-visual">
            <CodeWindow />
          </Reveal>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        <div className="landing-stats-inner">
          <StatItem value="15+" label="Languages supported" delay={0} />
          <div className="landing-stats-divider" />
          <StatItem value="< 10s" label="Average review time" delay={80} />
          <div className="landing-stats-divider" />
          <StatItem value="3" label="Review dimensions" delay={160} />
          <div className="landing-stats-divider" />
          <StatItem value="100%" label="Private by default" delay={240} />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section" id="features">
        <Reveal>
          <div className="landing-section-label">Features</div>
          <h2 className="landing-h2">Everything you need,<br />nothing you don't.</h2>
        </Reveal>

        <div className="landing-features-grid">
          <FeatureCard delay={0} icon="🔍" title="Bug Detection" desc="Spots null dereferences, off-by-one errors, unchecked exceptions, and logic flaws before they hit production." />
          <FeatureCard delay={80} icon="⚡" title="Performance Insights" desc="Identifies O(n²) loops, redundant re-renders, missing indexes, and memory leaks with actionable rewrites." />
          <FeatureCard delay={160} icon="🛡️" title="Security Scanning" desc="Detects SQL injection, XSS vectors, insecure deserialization, and hardcoded secrets automatically." />
          <FeatureCard delay={240} icon="📋" title="Best Practices" desc="Enforces SOLID principles, naming conventions, and idiomatic patterns specific to your language." />
          <FeatureCard delay={320} icon="📊" title="Review Analytics" desc="Track your score trends, most common issues, and language distribution over time." />
          <FeatureCard delay={400} icon="🕓" title="Full History" desc="Every review saved. Search, filter, and compare past analyses to see how your code quality evolves." />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section landing-section--alt" id="how">
        <Reveal>
          <div className="landing-section-label">How it works</div>
          <h2 className="landing-h2">Three steps to better code.</h2>
        </Reveal>

        <div className="landing-steps">
          {[
            { n: "01", title: "Paste your code", desc: "Drop in any snippet — function, class, file, or algorithm. Select your language and optionally name the file." },
            { n: "02", title: "AI analyzes it", desc: "Advanced AI models read your code in full context, identifying issues across bugs, performance, and security dimensions." },
            { n: "03", title: "Act on feedback", desc: "Get a score, a summary, and line-specific insights. Every review is saved to your history for future reference." },
          ].map((step, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="landing-step">
                <div className="landing-step-num">{step.n}</div>
                <div>
                  <h3 className="landing-step-title">{step.title}</h3>
                  <p className="landing-step-desc">{step.desc}</p>
                </div>
                {i < 2 && <div className="landing-step-arrow">→</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="landing-section" id="testimonials">
        <Reveal>
          <div className="landing-section-label">Testimonials</div>
          <h2 className="landing-h2">Trusted by developers.</h2>
        </Reveal>

        <div className="landing-testi-wrap">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="landing-testi"
              style={{
                opacity: activeTesti === i ? 1 : 0,
                transform: activeTesti === i ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
                position: i === 0 ? "relative" : "absolute",
                top: i === 0 ? undefined : 0,
                left: i === 0 ? undefined : 0,
                right: i === 0 ? undefined : 0,
                pointerEvents: activeTesti === i ? "auto" : "none",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              <p className="landing-testi-quote">"{t.quote}"</p>
              <div className="landing-testi-author">
                <div className="landing-testi-avatar">{t.name[0]}</div>
                <div>
                  <div className="landing-testi-name">{t.name}</div>
                  <div className="landing-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="landing-testi-dots">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} className={`landing-testi-dot ${activeTesti === i ? "active" : ""}`} onClick={() => setActiveTesti(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-section">
        <Reveal>
          <div className="landing-cta-inner">
            <div className="landing-cta-glow" />
            <h2 className="landing-cta-title">Start reviewing smarter.</h2>
            <p className="landing-cta-sub">Free to use. No setup. Your first review takes under a minute.</p>
            <Link to="/login" className="landing-btn-primary landing-btn-lg landing-btn-white">
              Open CodeLensAI
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo" style={{ opacity: 0.7 }}>
            <div className="landing-logo-icon" style={{ background: 'transparent', border: 'none' }}>
              <img src="/logo.png" alt="CodeLensAI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span>CodeLensAI</span>
          </div>
          <p className="landing-footer-copy">© {new Date().getFullYear()} CodeLensAI. Built with Advanced AI.</p>
        </div>
      </footer>
    </div>
  );
}
