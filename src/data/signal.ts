export const streams = ([
  {
    id: 'engineering-reads',
    label: 'Engineering Reads',
    feed: 'https://feeds.alloneof.me/eng.atom',
    thumbnail: 'left',
  },
  {
    id: 'engineering-leaders',
    label: 'Leadership Reads',
    feed: 'https://feeds.alloneof.me/eng-leaders.atom',
    thumbnail: 'right',
  },
] as const).map((stream) => ({ ...stream, href: `/signals/${stream.id}/` }));

export type SignalStream = (typeof streams)[number];
