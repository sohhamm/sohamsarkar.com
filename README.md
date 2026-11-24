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

## IndexNow

Bing, Yandex, and the other IndexNow engines learn about new or changed pages from a ping instead of
waiting to re-crawl the sitemap. The key is public by design: `public/<key>.txt` holds the
32-character key and serves it at `https://sohamsarkar.com/<key>.txt`. Rotate it by replacing that
file.

After a deploy that adds, removes, or materially changes pages is live, run:

```bash
bun run seo:indexnow --dry-run   # lists every sitemap URL and whether the key file is live
bun run seo:indexnow             # submits them to api.indexnow.org
```

The script reads `https://sohamsarkar.com/sitemap-index.xml` (following the sitemap index) and
refuses to submit while the key file is not yet served. Resubmitting unchanged pages earns nothing
and IndexNow answers `429` to traffic it treats as spam, so run it once per content deploy, not per
push. Google does not take part in IndexNow; request indexing for a specific page from Search
Console.
