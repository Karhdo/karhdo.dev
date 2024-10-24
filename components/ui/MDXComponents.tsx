import Pre from 'pliny/ui/Pre';
import TOCInline from 'pliny/ui/TOCInline';
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm';
import type { MDXComponents } from 'mdx/types';

import { Link, TableWrapper } from '@/components/ui';

import Image from '@/components/ui/Image';

const components: MDXComponents = {
  Image,
  TOCInline,
  a: Link,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
};

export default components;
