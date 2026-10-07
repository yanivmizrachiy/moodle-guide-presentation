import { afterEach, describe, expect, it, vi } from 'vitest';
import { fullscreenElement, installFirstInteractionFullscreen, isFullscreenSupported } from '../src/lib/fullscreen';

function fakeBrowser() {
  const win = new EventTarget();
  const doc = new EventTarget() as EventTarget & {
    fullscreenEnabled: boolean;
    fullscreenElement: Element | null;
    documentElement: { requestFullscreen: ReturnType<typeof vi.fn> };
  };
  const requestFullscreen = vi.fn(async () => {
    doc.fullscreenElement = doc.documentElement as unknown as Element;
    doc.dispatchEvent(new Event('fullscreenchange'));
  });
  doc.fullscreenEnabled = true;
  doc.fullscreenElement = null;
  doc.documentElement = { requestFullscreen };
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('navigator', { webdriver: false });
  return { win, doc, requestFullscreen };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('REQ-PRESENTATION-004 first-interaction fullscreen', () => {
  it('requests fullscreen on the first completed real interaction and then stops', async () => {
    const { win, requestFullscreen } = fakeBrowser();
    expect(isFullscreenSupported()).toBe(true);
    installFirstInteractionFullscreen();
    win.dispatchEvent(new Event('pointerup'));
    await Promise.resolve();
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(fullscreenElement()).not.toBeNull();
    win.dispatchEvent(new Event('pointerup'));
    await Promise.resolve();
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('retries after refusal and stops after a later success', async () => {
    const { win, doc, requestFullscreen } = fakeBrowser();
    requestFullscreen
      .mockImplementationOnce(async () => { throw new Error('NotAllowedError'); })
      .mockImplementationOnce(async () => {
        doc.fullscreenElement = doc.documentElement as unknown as Element;
        doc.dispatchEvent(new Event('fullscreenchange'));
      });
    installFirstInteractionFullscreen();
    win.dispatchEvent(new Event('pointerup'));
    await Promise.resolve();
    await Promise.resolve();
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(fullscreenElement()).toBeNull();
    win.dispatchEvent(new Event('keydown'));
    await Promise.resolve();
    await Promise.resolve();
    expect(requestFullscreen).toHaveBeenCalledTimes(2);
    expect(fullscreenElement()).not.toBeNull();
  });

  it('does not request fullscreen in automated browser runs', async () => {
    const { win, requestFullscreen } = fakeBrowser();
    vi.stubGlobal('navigator', { webdriver: true });
    installFirstInteractionFullscreen();
    win.dispatchEvent(new Event('pointerup'));
    await Promise.resolve();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });
});
