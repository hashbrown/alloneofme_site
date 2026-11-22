# alloneof.me

Personal site built with Astro, TypeScript, and CSS. Astro renders the site to static HTML at build time. Site content lives in source files, with GitHub planned as the publishing workflow.

## Local development

Run commands from the project root. Use the Node version in `.node-version`. The global Vite+ CLI (`vp`) uses the npm version declared in `package.json`.

| Task | Command |
| --- | --- |
| Install dependencies | `vp install` |
| Start the Astro dev server | `vp run dev` |
| Build the static site into `dist/` | `vp run build` |
| Serve the production build locally | `vp run preview` |

Use `vp run` to invoke Astro's project scripts. Open the URL printed by the server, usually `http://localhost:4321`, and press `Ctrl+C` in that terminal to stop it. After changes, run `vp run build` and check the affected pages in the browser.

Read the [Vite+ reference](https://viteplus.dev/llms-full.txt) for CLI behavior, commands, and configuration.

## Project layout

- `src/pages/` owns routes. The shared header and navigation live in `src/layouts/SiteLayout.astro`, with site-wide styles in `src/styles/site.css`.
- `src/content/writing/` and `src/content/projects/` hold Markdown entries for Words In Order and Lab. Their frontmatter schemas live in `src/content.config.ts`.
- `src/data/signal.ts` holds the curated Signal streams and links.

## Hosting

The planned production host is Cloudflare Workers Static Assets, with builds triggered from GitHub. Cloudflare will run `npm run build` and serve `dist/`. Deployment configuration is still pending. See the [Cloudflare Astro guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) when setting up hosting.
