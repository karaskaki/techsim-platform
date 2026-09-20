import { Terminal, BookOpen, Sparkles } from 'lucide-react';

export function LLDWorkspace() {
  return (
    <div style={styles.container}>
      <div style={styles.gridOverlay} />
      
      {/* Hero preview banner */}
      <div style={styles.hero}>
        <div style={styles.badge}>
          <Sparkles size={13} color="#06B6D4" />
          <span>SPRINT 5 — LOW LEVEL DESIGN SUITE</span>
        </div>
        <h1 style={styles.title}>LLD Engineering Studio</h1>
        <p style={styles.subtitle}>
          Interactive environment for mastering Object-Oriented Design, SOLID Principles, Design Patterns, and clean architecture with a multi-language IDE.
        </p>
      </div>

      {/* Feature roadmap preview cards */}
      <div style={styles.cardsGrid}>
        <div style={styles.featureCard}>
          <div style={{ ...styles.iconWrap, background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4' }}>
            <Terminal size={22} />
          </div>
          <h3 style={styles.cardTitle}>Custom Monaco IDE</h3>
          <p style={styles.cardDesc}>
            Full-featured code editor with syntax highlighting, IntelliSense, and multi-language execution (Python, C++, Java, TypeScript) via secure sandbox.
          </p>
          <div style={styles.tag}>Phase 2 Execution</div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ ...styles.iconWrap, background: 'rgba(124, 58, 237, 0.12)', color: '#A78BFA' }}>
            <Sparkles size={22} />
          </div>
          <h3 style={styles.cardTitle}>AI Design Copilot</h3>
          <p style={styles.cardDesc}>
            Real-time feedback on your class structures, abstraction layers, coupling/cohesion scores, and adherence to SOLID guidelines.
          </p>
          <div style={{ ...styles.tag, color: '#C4B5FD', borderColor: 'rgba(124, 58, 237, 0.3)' }}>AI Integration</div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ ...styles.iconWrap, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
            <BookOpen size={22} />
          </div>
          <h3 style={styles.cardTitle}>Roadmap & Practice Hub</h3>
          <p style={styles.cardDesc}>
            Structured curriculum covering Creational, Structural, and Behavioral patterns alongside 10 curated interview challenge problems.
          </p>
          <div style={{ ...styles.tag, color: '#6EE7B7', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Curriculum</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px 24px',
    fontFamily: "'DM Sans', sans-serif",
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, #252535 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    opacity: 0.4,
    pointerEvents: 'none',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '680px',
    marginBottom: '40px',
    zIndex: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '16px',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.25)',
    color: '#67E8F9',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: '0.08em',
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    color: 'var(--text)',
    letterSpacing: '-0.03em',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    maxWidth: '960px',
    width: '100%',
    zIndex: 1,
  },
  featureCard: {
    background: 'var(--sidebar-bg)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  },
  iconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '8px',
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--text-dim)',
    lineHeight: 1.5,
    marginBottom: '20px',
    flex: 1,
  },
  tag: {
    alignSelf: 'flex-start',
    fontSize: '10.5px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    color: '#67E8F9',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.04em',
  },
};
