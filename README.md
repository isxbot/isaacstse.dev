# isaacstse.dev

Source for [dillon.isaacstse.dev](https://dillon.isaacstse.dev), my personal site.

| Folder | What's in it |
|---|---|
| [`site/`](site/) | The website, built with [Astro](https://astro.build) into static HTML |
| [`infra/`](infra/) | AWS CDK stack: Route 53, ACM, S3, CloudFront |
| [`.github/workflows/`](.github/workflows/) | GitHub Actions pipeline that builds and deploys the site |

## Run the site locally

Requires Node 22 (see `.nvmrc`).

```sh
cd site
npm install
npm run dev      # http://localhost:4321
```

`npm run build` writes the finished site to `site/dist/`.

See [`site/README.md`](site/README.md) for how the site is organized and how to add notes.
