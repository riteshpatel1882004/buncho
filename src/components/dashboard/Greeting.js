'use client';

import { useEffect, useState } from 'react';

function partOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

// First render uses India time on the server and in the browser so both match. Right after that it
// switches to the visitor's own clock and keeps itself up to date.
const indiaHour = () =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date()));

/** Phone: small muted "Good morning" on line 1, the name in large type on line 2. Desktop: "Good morning, Name" on one line. */
export default function Greeting({ name }) {
  const [greeting, setGreeting] = useState(() => partOfDay(indiaHour()));

  useEffect(() => {
    const update = () => setGreeting(partOfDay(new Date().getHours()));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="flex min-w-0 flex-col text-2xl font-semibold leading-tight tracking-tight sm:flex-row sm:flex-nowrap sm:items-center sm:gap-x-2 sm:text-3xl">
      <span suppressHydrationWarning className="shrink-0 text-sm font-medium tracking-normal text-muted sm:text-3xl sm:font-semibold sm:tracking-tight sm:text-ink">
        {greeting}
        {name && <span className="hidden sm:inline">,</span>}
      </span>
      {name && <span className="min-w-0 truncate text-[1.65rem] sm:text-3xl">{name}</span>}
    </h1>
  );
}