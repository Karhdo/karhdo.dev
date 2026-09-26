/**
 * Components available to every MDX entry: pass as `<Content components={mdxComponents} />`.
 * Posts use `<Twemoji emoji="…" />` and `<Callout type="…">` without importing them.
 * `BlogNewsletterForm` keeps v1's MDX component name (task 22).
 */
import NewsletterCard from '~/components/blog/NewsletterCard.astro';
import Twemoji from '~/components/ui/Twemoji.astro';
import Callout from './Callout.astro';
import MdxImage from './MdxImage.astro';
import MdxLink from './MdxLink.astro';
import TableWrapper from './TableWrapper.astro';

export const mdxComponents = {
  Twemoji,
  Callout,
  BlogNewsletterForm: NewsletterCard,
  a: MdxLink,
  img: MdxImage,
  table: TableWrapper,
};
