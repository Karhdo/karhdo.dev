/**
 * Components available to every MDX entry: pass as `<Content components={mdxComponents} />`.
 * Posts use `<Twemoji emoji="…" />` and `<Callout type="…">` without importing them.
 */
import Twemoji from '~/components/ui/Twemoji.astro';
import Callout from './Callout.astro';
import MdxImage from './MdxImage.astro';
import MdxLink from './MdxLink.astro';
import TableWrapper from './TableWrapper.astro';

export const mdxComponents = { Twemoji, Callout, a: MdxLink, img: MdxImage, table: TableWrapper };
