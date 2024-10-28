'use client';

import { useState } from 'react';
import { Comments as CommentsComponent } from 'pliny/comments';

import siteMetadata from '@/data/siteMetadata';

export default function Comments({ slug }: { slug: string }) {
  const [loadComments, setLoadComments] = useState(false);

  if (!siteMetadata.comments?.provider) {
    return null;
  }
  return (
    <>
      {loadComments ? (
        <CommentsComponent commentsConfig={siteMetadata.comments} slug={slug} />
      ) : (
        <button onClick={() => setLoadComments(true)}>Load Comments</button>
      )}
    </>
  );
}
