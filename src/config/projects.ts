import type { ImageMetadata } from 'astro';
import ecomHeat from '~/assets/projects/ecom-heat.png';
import karhdoBlog from '~/assets/projects/karhdo-blog.png';
import military7aBidding from '~/assets/projects/military-7a-bidding.png';
import simulateGeometry from '~/assets/projects/simulate-geometry.png';
import websiteSellingFood from '~/assets/projects/website-selling-food.png';

export type Fact = { value: string; label: string };

export type Project = {
  type: 'work' | 'self';
  title: string;
  description?: string;
  builtWith: string[];
  image: ImageMetadata;
  imageAlt: string;
  /** Host label in the browser-frame bar, e.g. 'youneteci.com/eci-ecomheat'. */
  frameLabel: string;
  url?: string;
  /** GitHub repo as 'owner/name' (live repo data arrives in task 20). */
  repo?: string;
  org?: string;
  tagline?: string;
  featured?: boolean;
  /** Shown in the homepage "Selected projects" block (task 15). */
  selected?: boolean;
  facts?: [Fact, Fact, Fact];
};

export const PROJECTS: Project[] = [
  {
    type: 'work',
    title: 'EcomHeat',
    description:
      'The first e-commerce data intelligence platform in Vietnam. Brands track market share, monitor sales performance and optimise store operations with the most granular data available.',
    image: ecomHeat,
    imageAlt: 'EcomHeat market overview dashboard: sold items, GMV and market share by brand',
    frameLabel: 'youneteci.com/eci-ecomheat',
    url: 'https://youneteci.com/en/eci-ecomheat/?ref=karhdo.dev',
    org: 'YouNet Media',
    featured: true,
    selected: true,
    facts: [
      { value: 'Market share', label: 'across marketplaces' },
      { value: 'Competitor', label: 'research tools' },
      { value: 'Fullstack', label: 'my role' },
    ],
    builtWith: ['React', 'Bootstrap', 'FeathersJS', 'MySQL', 'RabbitMQ'],
  },
  {
    type: 'work',
    title: 'Military 7A Bidding',
    description:
      'Creating a web-based system designed for the efficient management of bidding packages related to medical supplies information.',
    image: military7aBidding,
    imageAlt: 'Military 7A Bidding home page with a bidding-package search and category list',
    frameLabel: 'military-7a-bidding (internal)',
    builtWith: ['NestJS', 'PostgreSQL', 'JWT', 'VueJS', 'Tailwind'],
  },
  {
    type: 'self',
    title: 'karhdo.dev',
    description: 'This site. v2 moves from Next.js to Astro with Bun, Tailwind v4, Drizzle and view transitions.',
    // TODO(screenshot): this still shows the v1 (Next.js) site; refresh after the v2 launch.
    image: karhdoBlog,
    imageAlt: 'The karhdo.dev blog home page',
    frameLabel: 'karhdo.dev',
    repo: 'Karhdo/karhdo.dev',
    tagline: 'Open source',
    selected: true,
    builtWith: ['Astro', 'Bun', 'Tailwind', 'Drizzle'],
  },
  {
    type: 'self',
    title: 'Website Selling Food',
    image: websiteSellingFood,
    imageAlt: 'Fresh Food store front page with a strawberry hero banner',
    frameLabel: 'github.com/Karhdo/Website-Selling-Food',
    repo: 'Karhdo/Website-Selling-Food',
    builtWith: ['PHP', 'Laravel', 'MySQL', 'VueJS', 'Bootstrap'],
  },
  {
    type: 'self',
    title: 'Simulate Basic Geometry',
    description: 'Explore the World of Basic 3D Modeling Simulations on Our Website.',
    image: simulateGeometry,
    imageAlt: 'A wireframe sphere casting a shadow on a 3D grid, with camera and light controls',
    frameLabel: 'github.com/Karhdo/geometry-simulation',
    repo: 'Karhdo/geometry-simulation',
    tagline: '3D on the web',
    selected: true,
    builtWith: ['Javascript', 'Jquery', 'ThreeJS'],
  },
];
