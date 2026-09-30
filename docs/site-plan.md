# isaacstse.dev — Site Content Plan

Personal site for job applications, aimed at commercial SRE / Platform Engineering roles.
Style: simple and content-first, in the spirit of brendangregg.com.

- **URL:** https://dillon.isaacstse.dev (apex `isaacstse.dev` redirects here)
- **Contact:** dillon@isaacstse.dev

## Sections

| Section | Purpose | Launch? |
|---|---|---|
| Home | Short intro, name, photo, links to every section | Yes |
| Resume | Web version plus a downloadable PDF | Yes |
| Notes | Reading notes from technical books, in my own words; occasional TIL entries | Yes (1–2 pages) |
| Colophon | How the site is built (Astro, CDK, CloudFront, CI) with a link to the repo | Yes |
| About / Contact | Short bio and email | Yes (can live on Home) |
| Projects | 2–3 short write-ups showing SRE/platform impact | Later |
| Library | Catalog of my book collection; entries link to notes | Later |

## Content guidelines

- Write notes in my own words: takeaways and how ideas apply, not copied passages.
- Label notes as working notes; they don't need to be polished essays.
- Keep work-related content high level; check what my employer and security office are comfortable with before publishing anything derived from work.
- No fixed posting schedule. Add content when it's ready.

## Launch scope

1. Home
2. Resume
3. Colophon
4. One or two notes pages

Ship this first, then add Projects and Library.

## Decisions

- **Homepage:** written as a Unix man page (`DILLON(1)`, NAME, SYNOPSIS, OPTIONS, ...).
- **Other pages:** JetBrains Mono for navigation, headings, and metadata; Source Serif 4 for reading text.
- **Theme:** follows the visitor's system setting; a `--theme=dark` / `--theme=light` toggle overrides it.
- **Clearance:** not mentioned anywhere on the site.
- **Site generator:** Astro, static output only.
- **Repo and CI:** GitHub, with GitHub Actions deploying to AWS via OIDC.
- **Hosting:** S3 + CloudFront + ACM + Route 53, defined in AWS CDK (TypeScript).

## Ideas for later

- Library: catalog stored as YAML/JSON, sortable list, covers by ISBN
- Status page at `status.isaacstse.dev` backed by a CloudWatch Synthetics canary
