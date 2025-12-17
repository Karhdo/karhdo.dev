import type { LinkProps } from 'next/link';
import NextLink from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

interface LinkPropsExtended extends LinkProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const Link: React.FC<LinkPropsExtended> = (props) => {
  const { href, ...rest } = props;

  const isInternalLink = href?.startsWith('/');
  const isAnchorLink = href?.startsWith('#');

  if (isInternalLink) {
    return <NextLink className="break-words" href={href} {...rest} />;
  }

  if (isAnchorLink) {
    return <a className="break-words" href={href} {...rest} />;
  }

  return <a className="break-words" target="_blank" rel="noopener noreferrer" href={href} {...rest} />;
};

export default Link;
