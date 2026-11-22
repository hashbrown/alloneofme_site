interface Stream {
  id: string;
  title: string;
  description: string;
  feed?: string;
  entries: {
    title: string;
    summary: string;
    url?: string;
    thumbnail?: 'left' | 'right';
  }[];
}

export const streams: Stream[] = [
  {
    id: 'engineering-reads',
    title: 'Engineering Reads',
    description: 'Selected links on building and maintaining software.',
    feed: 'https://feeds.alloneof.me/eng.atom',
    entries: [
      {
        title: 'Fast is better than slow',
        summary: 'Patrick Dubroy on how shorter feedback loops help engineers try more approaches.',
        url: 'https://dubroy.com/blog/fast-is-better-than-slow/',
        thumbnail: 'left',
      },
    ],
  },
  {
    id: 'engineering-leaders',
    title: 'Engineering Leaders',
    description: 'Selected reading on leading teams and making decisions.',
    entries: [
      {
        title: 'Make room for the long view',
        summary: 'A sample entry about setting aside time to notice which problems recur from sprint to sprint.',
        thumbnail: 'right',
      },
    ],
  },
];
