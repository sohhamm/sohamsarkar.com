import {defineCollection} from 'astro:content'
import {glob} from 'astro/loaders'
import {z} from 'astro/zod'

const projectsCollection = defineCollection({
  loader: glob({pattern: '*.md', base: './src/content/projects'}),
  schema: ({image}) =>
    z.object({
      title: z.string(),
      description: z.string(),
      link: z.string(),
      image: image(),
      tags: z.array(z.string()),
      sourceCode: z.string(),
      order: z.number(),
    }),
})

export const collections = {
  projects: projectsCollection,
}
