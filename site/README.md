# site

The website. [Astro](https://astro.build) turns the files in `src/` into plain HTML and CSS in
`dist/`, which is what gets uploaded to S3. Visitors never run Astro; they just get static files.

```sh
npm install      # first time only
npm run dev      # local server with live reload at http://localhost:4321
npm run build    # production build into dist/ (drafts left out)
npm run preview  # serve dist/ locally to check the production build
```

## How it's organized

```
site/
├── astro.config.mjs        Site URL, URL style (trailing slashes), Markdown settings
├── public/                 Copied into dist/ as-is: favicon, photo, resume PDF
└── src/
    ├── site.ts             Your name, email, profile links, and the nav list. Edit here first.
    ├── layouts/
    │   └── Base.astro      The shared page shell: <head>, top bar, footer
    ├── components/
    │   └── ThemeToggle.astro   The --theme=dark/light button
    ├── pages/              One file per URL
    │   ├── index.astro         /            (the man page)
    │   ├── resume.astro        /resume/
    │   ├── colophon.astro      /colophon/
    │   ├── 404.astro           404.html     ("No manual entry for ...")
    │   └── notes/
    │       ├── index.astro     /notes/      (list of books)
    │       └── [...id].astro   /notes/<file-name>/  (one page per note)
    ├── content/
    │   └── notes/          Your reading notes, one Markdown file per book
    ├── content.config.ts   The fields every note must have (title, author, status, ...)
    ├── notes.ts            Small helpers: sort notes, hide drafts, format dates
    └── styles/
        └── global.css      All the CSS: colors, fonts, layout
```

### An `.astro` file in 30 seconds

The part between the `---` fences runs at build time (it's TypeScript). Everything below it is
HTML, where `{curly braces}` insert values:

```astro
---
import Base from '../layouts/Base.astro';
const name = 'Dillon';
---
<Base title="Example">
  <p>Hello, {name}.</p>
</Base>
```

`<Base>` wraps the page in the shared layout. Whatever you put inside it lands where Base.astro
says `<slot />`.

## Common tasks

**Add a reading note.** Create `src/content/notes/<book-name>.md`. The file name becomes the URL.
Copy the front matter (the block between `---` lines) from the example note. Use `## ` headings
for chapters: each one becomes an entry in the note's contents list. The build fails with a clear
message if a required field is missing or misspelled.

**Hide a note that isn't ready.** Set `draft: true`. It still shows in `npm run dev` (marked as
a draft) but is left out of the production build.

**Add your photo.** Save it as `public/photo.jpg` (square, at least 192×192 px), then follow the
TODO comment in `src/pages/index.astro`.

**Add your resume PDF.** Save it as `public/resume.pdf`. The resume page already links to it.

**Add a page (Projects, Library).** Create `src/pages/projects.astro` using `colophon.astro` as a
template, then add it to the `nav` list in `src/site.ts`. It appears in the top bar and as a flag
on the homepage automatically.

**Change colors or fonts.** Everything is in `src/styles/global.css`. The light and dark colors are
the variables at the top of the file.

## How the theme toggle works

1. By default, the CSS follows the visitor's system setting (`prefers-color-scheme`).
2. Clicking `--theme=` sets `data-theme="light"` or `"dark"` on `<html>`, which overrides the
   system setting, and saves the choice in `localStorage`.
3. A tiny script in the `<head>` of `Base.astro` reapplies a saved choice before the page draws,
   so there's no flash of the wrong theme.
4. Without JavaScript, the button stays hidden and the system setting is used.

## Keeping it maintainable

- `package-lock.json` pins exact dependency versions. Commit it.
- Node version is pinned in `/.nvmrc`.
- To upgrade Astro, run `npx @astrojs/upgrade` about once a year rather than skipping several
  major versions at once.
- Notes are plain Markdown, so they'd move to another tool with little work if Astro ever goes away.
