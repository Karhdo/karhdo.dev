/**
 * The v1 heading-anchor icon (heroicons mini "link", from v1 contentlayer.config.ts) as hast, for
 * `rehype-autolink-headings`' `content` option. Wrapped in `span.content-header-link`, hidden from
 * assistive tech (the anchor itself gets its accessible name from the heading).
 */
import { h, s } from 'hastscript';

export const linkIconHast = h('span.content-header-link', { ariaHidden: 'true' }, [
  s(
    'svg.linkicon',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor', width: 20, height: 20 },
    [
      s('path', {
        d: 'M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z',
      }),
      s('path', {
        d: 'M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z',
      }),
    ]
  ),
]);
