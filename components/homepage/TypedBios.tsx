import React from 'react';
import Typed from 'typed.js';

import Twemoji from '@/components/ui/Twemoji';

const TypedBios = () => {
  const el = React.useRef(null);
  const typed = React.useRef<Typed | null>(null);

  React.useEffect(() => {
    typed.current = new Typed(el.current, {
      stringsElement: '#bios',
      typeSpeed: 40,
      backSpeed: 10,
      loop: true,
      backDelay: 1000,
    });

    return () => typed.current?.destroy();
  }, []);

  return (
    <div>
      <ul id="bios" className="hidden">
        {/* <li>
          I'm aliased as <b className="font-medium">Karhdo</b> at work.
        </li> */}
        <li>
          I live in <b className="font-medium">Jaipur, India</b>.
        </li>
        <li>
          I was born in <b className="font-medium">Tonk, Rajasthan, India</b>.
        </li>
        <li>
          My first programming language I learnt was <b className="font-medium">Java</b>.
        </li>
        {/* <li>I love web development.</li> */}
        <li>
          I'm focusing on building <b className="font-medium">Scalable Solutions</b>.
        </li>
        <li>
          I work mostly with <b className="font-medium">Golang, .NET</b> backend technologies.
        </li>
        {/* <li>
          I'm a dog-person <Twemoji emoji="dog" />.
        </li> */}
        <li>
          I'm a sporty-guy. I love
          <span className="ml-1">
            <Twemoji emoji="cricket-game" /> Cricket.
          </span>
        </li>
        <li>
          I love listening <Twemoji emoji="musical-notes" /> Music.
        </li>
        {/* <li>
          I love playing video game <Twemoji emoji="video-game" />, LoL is my favorite one.
        </li> */}
      </ul>
      <span ref={el} className="text-neutral-900 dark:text-neutral-200" />
    </div>
  );
};

export default TypedBios;
