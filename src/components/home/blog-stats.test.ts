import { describe, expect, test } from 'bun:test';
import { unavailableSummary } from '~/lib/stats/summary';
import { bodyHtml } from './blog-stats';

const base = {
  posts: 3,
  views: 12_400,
  reactions: { loves: 124, applauses: 78, ideas: 52, bullseye: 32, total: 286 },
  series: [],
  delta: null,
  mostRead: { slug: 'x', title: 'A <b>"tricky"</b> & title', url: '/blog/x', views: 5_100 },
  points: 0,
  since: '2026-09-26',
};

describe('bodyHtml', () => {
  test('escapes the post title; count-up data holds the compact value', () => {
    const html = bodyHtml(base);
    expect(html).toContain('A &lt;b&gt;&quot;tricky&quot;&lt;/b&gt; &amp; title');
    expect(html).toContain('data-count="12.4" data-dec="1" data-suffix="k">12.4k</b>');
    expect(html).toContain('>5.1k<');
  });

  test('< 2 points: no chart, no delta, the collecting note', () => {
    const html = bodyHtml(base);
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('class="delta"');
    expect(html).toContain('Collecting daily stats since Sep 26');
  });

  test('chart and delta pill with ≥ 2 points', () => {
    const series = [
      { date: '2026-09-25', views: 3 },
      { date: '2026-09-26', views: 5 },
    ];
    const html = bodyHtml({ ...base, series, points: 2, delta: { pct: 18, direction: 'up' } });
    expect(html).toContain('<svg class="area" role="img" aria-label="Daily views over the last 2 days: min 3, max 5">');
    expect(html).toContain('▲');
    expect(html).toContain('18%</span>');
  });

  test('unavailable: dashes and the post count', () => {
    const html = bodyHtml(unavailableSummary(3));
    expect(html).toContain('Live stats unavailable · 3 posts published');
    expect(html).toContain('<b>—</b>');
    expect(html).toContain('<span class="mr-t">—</span>');
    expect(bodyHtml(unavailableSummary(1))).toContain('Live stats unavailable · 1 post published');
  });
});
