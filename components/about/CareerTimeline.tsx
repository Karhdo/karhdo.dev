import TimelineItem from './TimelineItem';

export const EXPERIENCES = [
  {
    org: 'LoginRadius LLP',
    url: 'https://loginradius.com/',
    logo: '/static/images/experiences/lr.png',
    start: 'June 2019',
    end: 'Present',
    title: 'Engineering Lead',
    icon: 'man-technologist',
    event: 'career-younetmedia',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          {/* <li>
            Build{' '}
            <a href="https://ecomheat.youneteci.com" rel="noopener noreferrer" target="_blank">
              Ecomheat
            </a>{' '}
            - a website helps to measure the performance of the industry and players on E-Commerce platforms thru cross
            E-commerce channels.
          </li>
          <li>
            Build <strong>AppCore</strong> - Developed and published core NestJS packages, including DatabaseModule,
            CacheModule, RedisModule, ConfigModule and others on npm to accelerate development and deployment across
            multiple projects.
          </li> */}
        </ul>
      );
    },
  },
  {
    org: 'Q3 Technologies',
    url: 'https://www.q3tech.com/',
    logo: '/static/images/experiences/q3.jpg',
    start: 'Dec 2018',
    end: 'June 2019',
    title: 'Senior Software Engineer',
    icon: 'man-technologist',
    event: 'career-qkit',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          {/* <li>
            <strong>Developed and maintained web applications</strong> for managing company website content, including
            blogs, clients, and recruitment.
          </li>
          <li>
            Implemented backend solutions using <strong> NestJS, PostgreSQL, and Prisma</strong>.
          </li>
          <li>
            <strong>Participated in Agile methodologies </strong> to boost project efficiency and completion rates.
          </li> */}
        </ul>
      );
    },
  },
  {
    org: 'Infosys Limited',
    url: 'https://www.infosys.com/',
    logo: '/static/images/experiences/infosys.png',
    start: 'Nov 2015',
    end: 'Nov 2018',
    title: 'Senior Systems Engineer',
    icon: 'man-technologist',
    event: 'career-qkit',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          {/* <li>
            Get a good degree at <strong>School of Computer Science</strong>
          </li>
          <li>
            While most of my friends pursued careers in <strong> Data or AI Engineering </strong>, I found my passion in{' '}
            {''}
            <strong>Software Engineering</strong> , particularly in web and app development. This decision has shaped
            who I am today.
          </li> */}
        </ul>
      );
    },
  },
];

const CareerTimeline = () => (
  <ul className="m-0 list-none p-0">
    {EXPERIENCES.map((experience, idx) => (
      <li key={experience.url} className="m-0 p-0">
        <TimelineItem exp={experience} last={idx === EXPERIENCES.length - 1} />
      </li>
    ))}
  </ul>
);

export default CareerTimeline;
