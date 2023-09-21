import Tag from '../Tag';

const BlogTags = ({ tags }: { tags: string[] }) => {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className='flex flex-wrap !mt-1'>
      {tags.map((tag) => (
        <Tag key={tag} text={tag} />
      ))}
    </div>
  )
}

export default BlogTags;
