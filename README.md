# Astro Starter Kit: Portfolio

```
npm create astro@latest -- --template portfolio
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/portfolio)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![portfolio](https://user-images.githubusercontent.com/4677417/186189473-03dda103-65d3-4220-8b60-180ccaee5939.png)


## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Dependency maintenance

Use Bun 1.4.4 and Node 24.22.0 (the version in `.node-version`). Run
`bun install --frozen-lockfile`, `bun run check`, `bun run typecheck`, and
`bun run build && bun scripts/vercel-headers.mjs` before merging.

TypeScript is intentionally on 6.0.3 because the stable Astro checker rejects
TypeScript 7.0. The version-scoped overrides keep Vercel build dependencies on
patched releases within their existing major versions; they require Bun 1.4.4.
