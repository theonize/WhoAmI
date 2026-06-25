# Content & chapter schema

All book content lives here as plain ES modules — no build step, no database.
The app reads `book.js`, which imports each chapter from `chapters/`.

## Adding a chapter

1. Copy an existing file in `chapters/` (e.g. `01-what-is-a-human.js`).
2. Give it a new `id`, `slug`, and `number`.
3. Import it in `book.js` and append it to the `chapters` array.
4. Add its path to the `PRECACHE` list in `/sw.js` so it works offline,
   and bump the `VERSION` constant there to refresh caches.

## Chapter schema

```js
export default {
  id: "04-some-id",          // unique, stable id (used for progress tracking)
  slug: "some-slug",         // URL fragment: #/chapter/some-slug
  number: 4,                  // display order / chapter number
  title: "Chapter Title",
  subtitle: "A short subtitle",
  summary: ["paragraph", "paragraph"],   // intro paragraphs

  passages: [ Passage, ... ],            // key passages for the chapter

  subtopics: [
    {
      id: "subtopic-id",                 // unique within the chapter (anchor target)
      heading: "Subtopic Heading",
      body: ["paragraph", "paragraph"],
      passages: [ Passage, ... ]         // optional
    }
  ],

  questions: [
    // type "study": shows a reveal-able answer.
    { id: "q-id", type: "study", q: "Question?", a: "Answer." },
    // type "reflection": shows a textarea the reader can write in (saved locally).
    { id: "q-id", type: "reflection", q: "Prompt?" }
  ]
};
```

### Passage shape

```js
{
  ref: "Genesis 1:26–27",     // display reference (en dash for ranges is fine)
  version: "WEB",             // translation code shown next to the reference
  verses: [
    { n: 26, t: "Verse text…" },
    { n: 27, t: "Verse text…" }
  ],
  note: "Optional translator/study note shown beneath the passage.",
  link: "https://…"           // optional; if omitted, a Bible Gateway link is generated
}
```

## A note on translations

The default translation is the **World English Bible (WEB)**, which is in the
public domain — so its text may be reproduced freely here. Each passage also
links out to the full text on Bible Gateway. If you switch to a copyrighted
translation (ESV, NIV, etc.), respect that publisher's quotation limits and
link out rather than reproducing long passages inline.
