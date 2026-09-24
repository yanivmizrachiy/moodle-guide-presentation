export const DISTRICT_EMBED_PARAM = 'embed';
export const GUIDE_LOCATION_MESSAGE = 'moodle-guide:location';

export function isDistrictEmbedMode(search?: string): boolean {
  if (typeof window === 'undefined' && search === undefined) return false;
  const value = search ?? window.location.search;
  const params = new URLSearchParams(value);
  return params.get(DISTRICT_EMBED_PARAM) === '1';
}

export function guideHrefOutsideEmbed(href?: string): string {
  const raw = href ?? (typeof window !== 'undefined' ? window.location.href : '');
  if (!raw) return '';
  const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'https://yanivmizrachiy.github.io');
  url.searchParams.delete(DISTRICT_EMBED_PARAM);
  return url.toString();
}

export function notifyDistrictParentOfGuideLocation(): void {
  if (typeof window === 'undefined') return;
  if (!isDistrictEmbedMode() || window.parent === window) return;

  window.parent.postMessage(
    {
      type: GUIDE_LOCATION_MESSAGE,
      href: guideHrefOutsideEmbed(window.location.href),
    },
    '*',
  );
}
