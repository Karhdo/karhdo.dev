import { EXPERIENCES } from '@/constants/index';

import TimelineItem from './TimelineItem';

const CareerTimeline = () => (
  <ul className="m-0 list-none p-0">
    {EXPERIENCES.map((experience, idx) => (
      <li key={experience.url} className="m-0 p-0">
        <TimelineItem experience={experience} last={idx === EXPERIENCES.length - 1} />
      </li>
    ))}
  </ul>
);

export default CareerTimeline;
