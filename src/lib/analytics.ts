const ANALYTICS_URL = 'https://ep-ancient-rice-b163hnr3.apirest.c-5.eu-central-1.aws.neon.tech/neondb/rest/v1/analytics_events';
const VISITOR_KEY = 'moodle_guide_visitor_id';
const SESSION_KEY = 'moodle_guide_session_id';
const SESSION_STARTED_KEY = 'moodle_guide_session_started';
const QUEUE_KEY = 'moodle_guide_analytics_queue';
const HEARTBEAT_MS = 5000;

type AnalyticsEvent = {
  id: string;
  session_id: string;
  visitor_id: string;
  event_type: 'session_start' | 'heartbeat' | 'slide_view' | 'session_end';
  slide_id: string | null;
  active_ms: number;
  client_ts: string;
  path: string;
  referrer: string | null;
  viewport_width: number;
  viewport_height: number;
};

function uuid() {
  return crypto.randomUUID();
}

function getOrCreate(storage: Storage, key: string) {
  const current = storage.getItem(key);
  if (current) return current;
  const value = uuid();
  storage.setItem(key, value);
  return value;
}

function currentSlideId() {
  return new URLSearchParams(window.location.search).get('slide');
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}`.slice(0, 500);
}

function readQueue(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as AnalyticsEvent[];
  } catch {
    return [];
  }
}

function writeQueue(queue: AnalyticsEvent[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    // Analytics must never interfere with the guide itself.
  }
}

async function postEvents(events: AnalyticsEvent[], keepalive = false) {
  if (!events.length) return true;
  try {
    const response = await fetch(ANALYTICS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      keepalive,
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal,resolution=ignore-duplicates',
      },
      body: JSON.stringify(events),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function startAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined;

  const visitorId = getOrCreate(localStorage, VISITOR_KEY);
  const sessionId = getOrCreate(sessionStorage, SESSION_KEY);
  let lastTick = performance.now();
  let lastSlide = currentSlideId();
  let stopped = false;

  const makeEvent = (
    eventType: AnalyticsEvent['event_type'],
    activeMs = 0,
    slideId = currentSlideId()
  ): AnalyticsEvent => ({
    id: uuid(),
    session_id: sessionId,
    visitor_id: visitorId,
    event_type: eventType,
    slide_id: slideId,
    active_ms: Math.max(0, Math.min(30000, Math.round(activeMs))),
    client_ts: new Date().toISOString(),
    path: currentPath(),
    referrer: document.referrer ? document.referrer.slice(0, 1000) : null,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });

  const send = async (event: AnalyticsEvent, keepalive = false) => {
    const queue = [...readQueue(), event];
    writeQueue(queue);
    const ok = await postEvents(queue, keepalive);
    if (ok) writeQueue([]);
  };

  const flushQueue = async () => {
    const queue = readQueue();
    if (!queue.length) return;
    if (await postEvents(queue)) writeQueue([]);
  };

  const activeDelta = () => {
    const now = performance.now();
    const delta = document.visibilityState === 'visible' ? now - lastTick : 0;
    lastTick = now;
    return delta;
  };

  const onNavigation = () => {
    const slideId = currentSlideId();
    if (slideId === lastSlide) return;
    lastSlide = slideId;
    void send(makeEvent('slide_view', 0, slideId));
  };

  const nativePushState = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<History['pushState']>) => {
    nativePushState(...args);
    window.dispatchEvent(new Event('analytics:navigation'));
  }) as History['pushState'];

  const nativeReplaceState = history.replaceState.bind(history);
  history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    nativeReplaceState(...args);
    window.dispatchEvent(new Event('analytics:navigation'));
  }) as History['replaceState'];

  window.addEventListener('analytics:navigation', onNavigation);
  window.addEventListener('popstate', onNavigation);

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      const delta = activeDelta();
      if (delta > 0) void send(makeEvent('heartbeat', delta), true);
    } else {
      lastTick = performance.now();
      void flushQueue();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('online', flushQueue);

  if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
    sessionStorage.setItem(SESSION_STARTED_KEY, '1');
    void send(makeEvent('session_start'));
  }
  void send(makeEvent('slide_view', 0, lastSlide));
  void flushQueue();

  const heartbeat = window.setInterval(() => {
    if (document.visibilityState !== 'visible') {
      lastTick = performance.now();
      return;
    }
    const delta = activeDelta();
    if (delta > 0) void send(makeEvent('heartbeat', delta));
  }, HEARTBEAT_MS);

  const onPageHide = () => {
    if (stopped) return;
    stopped = true;
    const delta = activeDelta();
    void send(makeEvent('session_end', delta), true);
  };
  window.addEventListener('pagehide', onPageHide);

  return () => {
    window.clearInterval(heartbeat);
    window.removeEventListener('analytics:navigation', onNavigation);
    window.removeEventListener('popstate', onNavigation);
    window.removeEventListener('online', flushQueue);
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    history.pushState = nativePushState;
    history.replaceState = nativeReplaceState;
  };
}
