import { BrandIconType } from '@/components/ui/BrandIcon';

type PopularTag = {
  href: string;
  iconType: BrandIconType;
  slug: string;
  title: string;
};

const popularTags: PopularTag[] = [
  {
    href: '/tags/golang',
    iconType: 'Go',
    slug: 'devops',
    title: 'Golang',
  },
];

export default popularTags;
