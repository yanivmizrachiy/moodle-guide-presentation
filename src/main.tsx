import React from 'react';
import ReactDOM from 'react-dom/client';
import Guide from './pages/Guide';
import { startAnalytics } from './lib/analytics';
import { installFirstInteractionFullscreen } from './lib/fullscreen';
import { isDistrictEmbedMode } from './lib/embed';
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

if (!isDistrictEmbedMode()) installFirstInteractionFullscreen();
startAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GuideErrorBoundary>
      <Guide />
    </GuideErrorBoundary>
  </React.StrictMode>
);
