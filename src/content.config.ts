import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const DISCIPLINAS = ['karate', 'bjj', 'muay-thai', 'boxeo', 'mma'] as const;
export const TIPOS_ARTICULO = ['guia-tecnica', 'historia', 'filosofia', 'entrenamiento'] as const;
export const NIVELES_DIFICULTAD = ['principiante', 'intermedio', 'avanzado', 'todos'] as const;

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(120),
      description: z.string().min(10, 'La descripción debe ser descriptiva').max(300),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      disciplina: z.enum(DISCIPLINAS, {
        errorMap: () => ({ message: 'Disciplina inválida. Permitidas: karate, bjj, muay-thai, boxeo, mma' }),
      }),
      tipo: z.enum(TIPOS_ARTICULO, {
        errorMap: () => ({ message: 'Tipo inválido. Permitidos: guia-tecnica, historia, filosofia, entrenamiento' }),
      }),
      dificultad: z.enum(NIVELES_DIFICULTAD).default('todos'),
      autor: z.object({
        name: z.string(),
        role: z.string().default('Instructor Marcial'),
        avatar: z.string().optional(),
      }),
      tags: z.array(z.string()).default([]),
      heroImage: z.optional(image()),
      readingTime: z.string().regex(/^\d+\s+min$/, 'Formato esperado: "X min" (ej. "6 min")'),
      featured: z.boolean().default(false),
    }),
});

export const collections = { blog };
