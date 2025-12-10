import TimelineItem from './TimelineItem';

export const EXPERIENCES = [
  {
    org: 'Spartan',
    url: 'https://hirespartan.io/',
    logo: '/static/images/experiences/spartan-logo.jpeg',
    start: 'Mar 2025',
    end: 'Present',
    title: 'Software Engineer',
    icon: 'man-technologist',
    event: 'career-spartan',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            <strong>
              <a href="https://dealops.com/" target="_blank" rel="noopener noreferrer">
                Dealops
              </a>
            </strong>{' '}
            – SaaS platform that helps Sales and Revenue Ops teams manage deal pricing and quoting with AI. Built a
            conversational chatbot UI using <strong>React, TypeScript, and TailwindCSS</strong>, integrating streaming
            APIs from the backend to deliver a smooth and responsive user experience. Also implemented complex pricing
            configuration and admin dashboards using <strong>React Hook Form</strong>, <strong>Ant Design</strong>, and
            a <strong>Turborepo</strong>-based monorepo to streamline development and deployment.
          </li>
          <li>
            <strong>
              <a href="https://www.deepskyclimate.com/" target="_blank" rel="noopener noreferrer">
                Deepsky
              </a>
            </strong>{' '}
            – Data platform for processing CO₂ removal measurements and validating them into carbon credits that can be
            traded on the global carbon market. Designed and implemented data pipelines following the{' '}
            <strong>medallion architecture</strong>, leveraging{' '}
            <strong>Apache Spark, Delta Lake, AWS S3, AWS EMR,</strong> and <strong>Databricks</strong> to optimize data
            processing and analytics workflows.
          </li>
        </ul>
      );
    },
  },
  {
    org: 'Younet Media',
    url: 'https://younetmedia.com',
    logo: '/static/images/experiences/younetmedia-logo.png',
    start: 'Mar 2022',
    end: 'Mar 2025',
    title: 'Junior Software Engineer',
    icon: 'man-technologist',
    event: 'career-younetmedia',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            Built{' '}
            <a href="https://ecomheat.youneteci.com" rel="noopener noreferrer" target="_blank">
              Ecomheat
            </a>{' '}
            – a web platform that measures industry and brand performance across major E-commerce channels, providing
            analytics and insights for marketing and business teams.
          </li>
          <li>
            Developed <strong>AppCore</strong> – a set of reusable <strong>NestJS</strong> core packages (including{' '}
            <strong>DatabaseModule, CacheModule, RedisModule, ConfigModule</strong>, and others) and published them to
            npm to accelerate development and deployment across multiple internal projects.
          </li>
        </ul>
      );
    },
  },
  {
    org: 'QKIT Software',
    url: 'https://qkit.vn',
    logo: '/static/images/experiences/qkit-logo.png',
    start: 'Jan 2021',
    end: 'Dec 2022',
    title: 'Fresher Backend Developer',
    icon: 'man-technologist',
    event: 'career-qkit',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            <strong>Developed and maintained web applications</strong> used to manage company website content, including
            blogs, client portfolios, and recruitment pages.
          </li>
          <li>
            Implemented backend services using <strong>NestJS, PostgreSQL, and Prisma</strong>, focusing on clean
            architecture, performance, and maintainability.
          </li>
          <li>
            <strong>Participated in Agile/Scrum workflows</strong>, collaborating closely with designers and senior
            engineers to improve delivery speed and overall project quality.
          </li>
        </ul>
      );
    },
  },
  {
    org: 'University of Information Technology',
    url: 'https://en.uit.edu.vn',
    logo: '/static/images/experiences/uit-logo.png',
    start: 'Aug 2019',
    end: 'Jun 2023',
    title: 'Student at UIT – HCMC (School of Computer Science)',
    icon: 'student',
    event: 'career-uit',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            Graduated with a good academic standing at the <strong>School of Computer Science</strong>.
          </li>
          <li>
            While many of my peers pursued careers in <strong>Data</strong> or <strong>AI Engineering</strong>, I found
            my passion in <strong>Software Engineering</strong>, especially in web and application development – a
            decision that has strongly shaped my current career path.
          </li>
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
