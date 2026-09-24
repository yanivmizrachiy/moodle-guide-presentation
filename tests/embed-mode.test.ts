import { describe, expect, it } from 'vitest';
import { guideHrefOutsideEmbed, isDistrictEmbedMode } from '../src/lib/embed';

describe('district embed mode', () => {
  it('activates only for embed=1', () => {
    expect(isDistrictEmbedMode('?embed=1')).toBe(true);
    expect(isDistrictEmbedMode('?embed=0')).toBe(false);
    expect(isDistrictEmbedMode('?slide=cover')).toBe(false);
  });

  it('keeps the current slide while removing the embed marker for the external handoff', () => {
    expect(
      guideHrefOutsideEmbed(
        'https://yanivmizrachiy.github.io/moodle-guide-presentation/?embed=1&slide=participants',
      ),
    ).toBe(
      'https://yanivmizrachiy.github.io/moodle-guide-presentation/?slide=participants',
    );
  });
});
