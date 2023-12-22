import type { Project } from '@/types/data';

const projectsData: Project[] = [
  {
    type: 'work',
    title: 'EcomHeat - Manage Market Share, Monitor Sales Performance, Optimize Store Operation',
    description:
      'The pioneering E-commerce data intelligence platform in Vietnam for brands with the most granular data information.',
    imgSrc: '/static/images/projects/ecom-heat.png',
    url: 'https://youneteci.com/en/eci-ecomheat/?ref=karhdo.dev',
    builtWith: ['React', 'Bootstrap', 'FeathersJS', 'MySQL', 'RabbitMQ'],
  },
  {
    type: 'work',
    title: 'Military 7A Bidding',
    description:
      'Creating a web-based system designed for the efficient management of bidding packages related to medical supplies information.',
    imgSrc: '/static/images/projects/military-7a-bidding.png',
    builtWith: ['NestJS', 'PosgreSQL', 'JWT', 'VueJS', 'Tailwind'],
  },
  {
    type: 'self',
    title: 'Personal website',
    imgSrc: '/static/images/projects/karhdo-blog.png',
    repo: 'karhdo.dev',
    builtWith: ['Next.js', 'Tailwind', 'Typescript', 'Prisma', 'Umami'],
  },
  {
    type: 'self',
    title: 'Website Selling Food',
    imgSrc: '/static/images/projects/website-selling-food.png',
    repo: 'Website-Selling-Food',
    builtWith: ['PHP', 'Laravel', 'MySQL', 'VueJS', 'Bootstrap'],
  },
  {
    type: 'self',
    title: 'Simulate Basic Geometry',
    description: 'Explore the World of Basic 3D Modeling Simulations on Our Website.',
    imgSrc: '/static/images/projects/simulate-geometry.png',
    repo: 'geometry-simulation',
    builtWith: ['Javascript', 'Jquery', 'ThreeJS'],
  },
];

export default projectsData;
