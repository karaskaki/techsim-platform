import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Code2, ArrowRight, Layers, Cpu, ShieldCheck, Terminal, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/client';

export function TrackSelector() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState<'HLD' | 'LLD' | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<'HLD' | 'LLD' | null>(null);

  const handleSelectTrack = async (track: 'HLD' | 'LLD') => {
    if (loadingTrack) return;
    setLoadingTrack(track);
    setSelectedTrack(track);

    // 1. Store in localStorage
    localStorage.setItem('lastTrack', track);

    // 2. Persist to MongoDB via user preferences endpoint
    try {
      const updated = await userApi.updatePreferences({ preferredTrack: track });
      if (user) {
        updateUser({
          ...user,
          preferredTrack: updated.preferredTrack ?? track,
        });
      }
    } catch (err) {
      console.error('Failed to persist track preference to server:', err);
      // Still allow navigation even if backend update fails
      if (user) {
        updateUser({
          ...user,
          preferredTrack: track,
        });
      }
    }

    // 3. Smooth transition to the selected track
    setTimeout(() => {
      if (track === 'HLD') {
        navigate('/canvas', { replace: true });
      } else {
        navigate('/lld', { replace: true });
      }
    }, 450);
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridOverlay} />
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>
            <Sparkles size={12} style={{ marginRight: 6 }} />
            CHOOSE YOUR LEARNING PATH
          </div>
          <h1 style={styles.title}>Select Your Design Track</h1>
          <p style={styles.subtitle}>
            Welcome, <span style={{ color: 'var(--text)', fontWeight: 600 }}>{user?.username || 'Architect'}</span>. 
            Choose your focus area to tailor your workspace. You can switch between tracks at any time.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={styles.cardsGrid}>
          {/* Card 1: HLD */}
          <div
            id="track-card-hld"
            style={{
              ...styles.card,
              ...(selectedTrack === 'HLD' ? styles.cardActive : {}),
            }}
            onClick={() => handleSelectTrack('HLD')}
            onMouseEnter={e => {
              if (selectedTrack !== 'HLD') {
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.6)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.15)';
              }
            }}
            onMouseLeave={e => {
              if (selectedTrack !== 'HLD') {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
              }
            }}
          >
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconBox, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>
                <Network size={28} color="white" />
              </div>
              <div style={styles.trackTag}>HIGH LEVEL DESIGN</div>
            </div>

            <h2 style={styles.cardTitle}>High Level Design (HLD)</h2>
            <p style={styles.cardDesc}>
              Architect large-scale distributed systems, design cloud microservices, and simulate real-time traffic, bottlenecks, and chaos failure scenarios.
            </p>

            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <Layers size={14} color="#A78BFA" />
                <span>Interactive Visual Architecture Canvas</span>
              </div>
              <div style={styles.featureItem}>
                <Cpu size={14} color="#A78BFA" />
                <span>Live Throughput, Latency & RPS Simulation</span>
              </div>
              <div style={styles.featureItem}>
                <ShieldCheck size={14} color="#A78BFA" />
                <span>Chaos Engineering & Fault Tolerance Testing</span>
              </div>
            </div>

            <div style={styles.cardFooter}>
              <button
                id="btn-select-hld"
                disabled={Boolean(loadingTrack)}
                style={{
                  ...styles.selectBtn,
                  background: selectedTrack === 'HLD' ? '#7C3AED' : 'rgba(124, 58, 237, 0.15)',
                  color: selectedTrack === 'HLD' ? '#FFFFFF' : '#C4B5FD',
                  borderColor: selectedTrack === 'HLD' ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)',
                }}
              >
                {loadingTrack === 'HLD' ? (
                  <>
                    <span style={styles.spinner} />
                    Launching HLD Canvas…
                  </>
                ) : (
                  <>
                    Enter HLD Studio
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: LLD */}
          <div
            id="track-card-lld"
            style={{
              ...styles.card,
              ...(selectedTrack === 'LLD' ? styles.cardActive : {}),
            }}
            onClick={() => handleSelectTrack('LLD')}
            onMouseEnter={e => {
              if (selectedTrack !== 'LLD') {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(6, 182, 212, 0.15)';
              }
            }}
            onMouseLeave={e => {
              if (selectedTrack !== 'LLD') {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
              }
            }}
          >
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconBox, background: 'linear-gradient(135deg, #06B6D4, #0D9488)' }}>
                <Code2 size={28} color="white" />
              </div>
              <div style={{ ...styles.trackTag, color: '#67E8F9', borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.1)' }}>
                LOW LEVEL DESIGN
              </div>
            </div>

            <h2 style={styles.cardTitle}>Low Level Design (LLD)</h2>
            <p style={styles.cardDesc}>
              Master object-oriented programming, design patterns, and SOLID principles with an interactive multi-language IDE, AI feedback, and structured problems.
            </p>

            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <Terminal size={14} color="#67E8F9" />
                <span>Custom Monaco IDE (Python, Java, C++, TS)</span>
              </div>
              <div style={styles.featureItem}>
                <CheckCircle2 size={14} color="#67E8F9" />
                <span>SOLID Principles & Design Pattern Roadmap</span>
              </div>
              <div style={styles.featureItem}>
                <Sparkles size={14} color="#67E8F9" />
                <span>AI Design Evaluation & AlgoMaster Practice</span>
              </div>
            </div>

            <div style={styles.cardFooter}>
              <button
                id="btn-select-lld"
                disabled={Boolean(loadingTrack)}
                style={{
                  ...styles.selectBtn,
                  background: selectedTrack === 'LLD' ? '#0891B2' : 'rgba(6, 182, 212, 0.15)',
                  color: selectedTrack === 'LLD' ? '#FFFFFF' : '#A5F3FC',
                  borderColor: selectedTrack === 'LLD' ? '#0891B2' : 'rgba(6, 182, 212, 0.4)',
                }}
              >
                {loadingTrack === 'LLD' ? (
                  <>
                    <span style={styles.spinner} />
                    Launching LLD Workspace…
                  </>
                ) : (
                  <>
                    Enter LLD Studio
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={styles.switchNotice}>
          💡 You can toggle between <strong>HLD</strong> and <strong>LLD</strong> at any time via the track switcher in the top navigation bar.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px 20px',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, #252535 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    opacity: 0.45,
    pointerEvents: 'none',
  },
  glowTop: {
    position: 'absolute',
    top: '-15%',
    left: '25%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-15%',
    right: '25%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    maxWidth: '960px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    color: 'var(--accent-bright)',
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    letterSpacing: '0.1em',
    marginBottom: '14px',
  },
  title: {
    fontSize: '34px',
    fontWeight: 800,
    color: 'var(--text)',
    letterSpacing: '-0.03em',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-dim)',
    maxWidth: '560px',
    lineHeight: 1.6,
    margin: '0 auto',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '28px',
    width: '100%',
    marginBottom: '32px',
  },
  card: {
    backgroundColor: 'var(--sidebar-bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)',
    transform: 'scale(1.01)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  iconBox: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
  },
  trackTag: {
    fontSize: '10.5px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#C4B5FD',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  cardTitle: {
    fontSize: '21px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 10px 0',
    letterSpacing: '-0.02em',
  },
  cardDesc: {
    fontSize: '13.5px',
    color: 'var(--text-dim)',
    lineHeight: 1.55,
    margin: '0 0 24px 0',
    minHeight: '62px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
    flex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  cardFooter: {
    marginTop: 'auto',
  },
  selectBtn: {
    width: '100%',
    padding: '12px 18px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  switchNotice: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
};
