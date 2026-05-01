import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const dateSchema = z
  .preprocess((input) => {
    if (input === undefined || input === null || input === '') {
      return undefined;
    }

    if (input instanceof Date) {
      return input;
    }

    if (typeof input === 'object') {
      const value = input as Record<string, unknown>;
      if (typeof value.value === 'string') return value.value;
      if (typeof value.date === 'string') return value.date;
      if (typeof value.raw === 'string') return value.raw;
    }

    if (typeof input === 'string' && input.trim() === '{{now}}') {
      return new Date().toISOString();
    }

    return input;
  }, z.coerce.date())
  .optional();

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: dateSchema,
    cover: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    location: z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

export const collections = { blog };
