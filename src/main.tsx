import React from 'react';
import ReactDOM from 'react-dom/client';
import Guide from './pages/Guide';
import { startAnalytics } from './lib/analytics';
import './index.css';
import './guide-visual-isolation.css';

type GuideErrorBoundaryState = { failed: boolean };

/**
 * Last line of defence for live classroom presentations: a runtime error must
 * never leave a blank screen mid-lesson. Inline styles only, so the fallback
 * renders even when the styling pipeline is part of what failed.
 */
class GuideErrorBoundary extends React.Component<React.PropsWithChildren, GuideErrorBoundaryState> {
  state: GuideErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): GuideErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Guide crashed:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        dir="rtl"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          background: '#020617',
          color: '#fff',
          fontFamily: "'Heebo', system-ui, sans-serif",
          textAlign: 'center',
          padding: 24,
        }}
      >
        <p style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>המצגת נתקלה בשגיאה.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            border: 'none',
            borderRadius: 9999,
            background: '#f59e0b',
            color: '#1e293b',
            fontFamily: 'inherit',
            fontSize: 17,
            fontWeight: 900,
            padding: '12px 32px',
            cursor: 'pointer',
          }}
        >
          רענון הדף
        </button>
      </div>
    );
  }
}

/**
 * REQ-PRESENTATION-004: browsers intentionally block requestFullscreen() until
 * a real user activation. The guide already fills the viewport immediately;
 * on the first eligible interaction we use that activation to enter native
 * fullscreen. The permanent fullscreen button in Guide remains the fallback.
 * Automated browsers are excluded so this browser policy does not destabilize
 * deterministic E2E/visual tests.
 */
function installFirstInteractionFullscreen() {
  if (!document.fullscreenEnabled || navigator.webdriver) return;

  let armed = true;
  const cleanup = () => {
    window.removeEventListener('pointerup', requestFullscreen);
    window.removeEventListener('keydown', requestFullscreen);
  };
  const requestFullscreen = () => {
    if (!armed) return;
    armed = false;
    cleanup();
    if (document.fullscreenElement) return;
    void document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen may still be denied by browser/embedding policy. The visible
      // fullscreen control remains available and the guide stays viewport-filling.
    });
  };

  window.addEventListener('pointerup', requestFullscreen, { capture: true });
  window.addEventListener('keydown', requestFullscreen, { capture: true });
}

installFirstInteractionFullscreen();
startAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GuideErrorBoundary>
      <Guide />
    </GuideErrorBoundary>
  </React.StrictMode>
);
