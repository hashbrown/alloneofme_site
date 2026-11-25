import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entry = z.object({
  title: z.string(),
  summary: z.string(),
  label: z.string().optional(),
  order: z.number().int(),
});

const writing = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/writing' }),
  schema: entry,
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: entry.extend({ repository: z.url().optional() }),
});

const quoteLists = defineCollection({
  loader: glob({ pattern: 'quotes.md', base: './src/content' }),
  schema: z.object({
    quotes: z.array(z.object({
      text: z.string().trim().min(1),
      author: z.string().trim().min(1).optional(),
    })),
  }),
});

export const collections = { writing, projects, quoteLists };
