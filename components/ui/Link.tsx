/* eslint-disable jsx-a11y/anchor-has-content */
import NextLink from 'next/link';
import type { LinkProps } from 'next/link';
import { AnchorHTMLAttributes } from 'react';

const Link = ({ href, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternalLink = href && href.startsWith('/');
  const isAnchorLink = href && href.startsWith('#');

  const className = 'break-words hover:text-gray-200 dark:hover:text-primary-600';

  if (isInternalLink) {
    return <NextLink className={className} href={href} {...rest} />;
  }

  if (isAnchorLink) {
    return <a className={className} href={href} {...rest} />;
  }

  return <a className={className} target="_blank" rel="noopener noreferrer" href={href} {...rest} />;
};

export default Link;
