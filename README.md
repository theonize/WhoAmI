# Who Am I?

**A treatise and study of the human condition** — delivered as an interactive,
offline-capable Progressive Web App (PWA) and published to GitHub Pages.

It explores three questions:

1. **What is a human?** — made in the image of God
2. **What does a human lack apart from God?** — the ache of separation
3. **What is a human as a child of God?** — adopted, remade, and named

Each chapter contains Bible passages, subtopics, and questions for study and
reflection.

## Features

- 📖 **Interactive book** — chapter navigation, table of contents, search
- ✝️ **Scripture inline** — public-domain World English Bible text, with a
  tap-through link to the full passage on Bible Gateway
- ❓ **Q&A** — collapsible study questions with answers, plus reflection prompts
  with a notepad that saves to your device
- ✅ **Reading progress** — mark chapters read; progress is remembered locally
- 🌓 **Light / dark theme** — follows your system, or toggle it
- 📲 **Installable & offline** — service worker caches the app so it works with
  no connection; "Add to Home Screen" on mobile
- 🛠️ **No build step, no dependencies** — plain HTML/CSS/ES modules

## Project structure

```
.
├── index.html                # App shell
├── offline.html              # Offline fallback page
├── manifest.webmanifest      # PWA manifest
├── sw.js                     # Service worker (offline cache)
├── .nojekyll                 # Tell GitHub Pages to serve files as-is
├── assets/
│   ├── css/styles.css        # Styles (light/dark, responsive)
│   └── js/
│       ├── app.js            # Router, rendering, interactions, PWA wiring
│       └── store.js          # localStorage (theme, progress, notes)
├── content/                  # ← the book content lives here
│   ├── book.js               # Book metadata + chapter list
│   ├── chapters/*.js         # One module per chapter
│   └── README.md             # Chapter schema & how to add chapters
├── icons/                    # Generated PWA icons + favicon
├── scripts/
│   ├── generate-icons.mjs    # Renders PNG icons (no image tools needed)
│   └── serve.mjs             # Tiny local static server
└── .github/workflows/deploy.yml   # GitHub Pages deploy
```

## Develop locally

No install needed (Node 18+ recommended for the helper scripts):

```bash
node scripts/serve.mjs        # serve at http://localhost:8080
# or: npm run serve
```

Then open the URL. To regenerate icons after changing the design:

```bash
node scripts/generate-icons.mjs   # or: npm run icons
```

Sanity-check the JS and content modules:

```bash
npm run check
```

### Add or edit content

All content is plain data in `content/`. To add a chapter, copy a file in
`content/chapters/`, import it in `content/book.js`, and add its path to the
`PRECACHE` list in `sw.js` (then bump the `VERSION` there). See
[`content/README.md`](content/README.md) for the full schema.

## Deploy to GitHub Pages

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**One-time setup:** in the repo, go to **Settings → Pages → Build and
deployment** and set **Source** to **GitHub Actions**.

After that:

- Every push to `main` builds and deploys the site.
- You can also trigger it manually from the **Actions** tab
  (*Deploy PWA to GitHub Pages → Run workflow*) — useful while developing on a
  feature branch.

The published site lives at:

```
https://theonize.github.io/WhoAmI/
```

Because every asset path is relative, the app also works from any sub-path or a
custom domain without changes.

## Scripture & translations

Inline scripture is the **World English Bible (WEB)**, which is in the **public
domain** and may be reproduced freely. Every reference also links to the full
passage on Bible Gateway. If you switch to a copyrighted translation (ESV, NIV,
etc.), respect that publisher's quotation limits and prefer linking out.

## License

Code is licensed under the terms in [`LICENSE`](LICENSE) (Apache-2.0).
