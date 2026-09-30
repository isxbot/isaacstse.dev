// https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    publisher: z.string().optional(),
    year: z.number().optional(),
    covers: z.string().optional(),
    updated: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
