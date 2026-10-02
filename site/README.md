# site

The website. [Astro](https://astro.build) turns the files in `src/` into plain HTML and CSS in
`dist/`, which is what gets uploaded to S3.

```sh
npm install      # first time only
npm run dev      # local server with live reload at http://localhost:4321
npm run build    # production build into dist/ (drafts excluded)
npm run preview  # serve dist/ locally to check the production build
```

## How it's organized

```
site/
├── astro.config.mjs        Site URL, URL style (trailing slashes), Markdown settings
├── public/                 Copied into dist/ as-is: favicon, photo, resume PDF
└── src/
    ├── site.ts             Name, email, profile links, and the nav list.
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
    │   └── notes/          Reading notes, one Markdown file per topic
    ├── content.config.ts   The fields every note must have (title, author, status, ...)
    ├── notes.ts            Helpers: sort notes, hide drafts, format dates
    └── styles/
        └── global.css      All the CSS: colors, fonts, layout
```

## Common tasks

**Add a reading note.** Create `src/content/notes/<book-name>.md`. The file name becomes the URL.
Copy the front matter (the block between `---` lines) from the example note. Use `## ` headings
for chapters, each one becomes an entry in the note's contents list.

**Hide a note that isn't ready.** Set `draft: true`. It still shows in `npm run dev` (marked as
a draft) but is excluded from production builds.
