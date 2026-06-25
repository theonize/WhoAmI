import { book } from "../../content/book.js";
import * as store from "./store.js";

/* ------------------------------------------------------------------ utils */
const $ = (sel, root = document) => root.querySelector(sel);
const REPO_URL = "https://github.com/theonize/WhoAmI";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const paras = (arr) => (arr || []).map((p) => `<p>${esc(p)}</p>`).join("");

function bgLink(passage) {
  if (passage.link) return passage.link;
  const ref = passage.ref.replace(/[–—]/g, "-"); // en/em dash -> hyphen
  const version = passage.version || book.translation.code || "WEB";
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`;
}

function chapterById(id) {
  return book.chapters.find((c) => c.id === id);
}
function chapterBySlug(slug) {
  return book.chapters.find((c) => c.slug === slug);
}

/* ----------------------------------------------------------------- render */
function renderPassage(p) {
  const verses = p.verses
    .map((v) => `<span class="v"><sup class="vn">${esc(v.n)}</sup>${esc(v.t)}</span> `)
    .join("");
  const note = p.note ? `<p class="passage-note">${esc(p.note)}</p>` : "";
  return `
    <figure class="passage">
      <blockquote>${verses}</blockquote>
      <figcaption>
        <a class="passage-ref" href="${esc(bgLink(p))}" target="_blank" rel="noopener noreferrer">
          ${esc(p.ref)} <span class="version">${esc(p.version || book.translation.code)}</span>
          <span class="ext" aria-hidden="true">↗</span>
        </a>
        ${note}
      </figcaption>
    </figure>`;
}

function renderQuestion(q) {
  if (q.type === "reflection") {
    return `
      <div class="qa-item reflection">
        <p class="q"><span class="q-kind reflect">Reflect</span>${esc(q.q)}</p>
        <textarea class="note" data-qid="${esc(q.id)}" rows="3"
          placeholder="Write your thoughts… (saved on this device)"></textarea>
        <p class="note-status" data-for="${esc(q.id)}" aria-live="polite"></p>
      </div>`;
  }
  return `
    <details class="qa-item study">
      <summary><span class="q-kind study">Study</span>${esc(q.q)}</summary>
      <div class="qa-answer">${paras([q.a])}</div>
    </details>`;
}

function renderSubtopic(s) {
  const passages = (s.passages || []).map(renderPassage).join("");
  return `
    <section class="subtopic" id="${esc(s.id)}">
      <h2>${esc(s.heading)}</h2>
      ${paras(s.body)}
      ${passages}
    </section>`;
}

function chapterNav(ch) {
  const i = book.chapters.indexOf(ch);
  const prev = book.chapters[i - 1];
  const next = book.chapters[i + 1];
  const prevHtml = prev
    ? `<a class="nav-prev" href="#/chapter/${esc(prev.slug)}"><span class="dir">← Previous</span><span class="t">${esc(prev.title)}</span></a>`
    : `<a class="nav-prev" href="#/"><span class="dir">← Home</span><span class="t">Contents</span></a>`;
  const nextHtml = next
    ? `<a class="nav-next" href="#/chapter/${esc(next.slug)}"><span class="dir">Next →</span><span class="t">${esc(next.title)}</span></a>`
    : `<a class="nav-next" href="#/"><span class="dir">Finish →</span><span class="t">Back to contents</span></a>`;
  return `<nav class="chapter-nav">${prevHtml}${nextHtml}</nav>`;
}

function renderChapter(ch) {
  const done = store.isComplete(ch.id);
  return `
    <article class="chapter">
      <header class="chapter-head">
        <p class="chapter-eyebrow">Chapter ${esc(ch.number)}</p>
        <h1>${esc(ch.title)}</h1>
        <p class="chapter-sub">${esc(ch.subtitle)}</p>
        <div class="chapter-actions">
          <button class="btn mark-complete${done ? " done" : ""}" data-id="${esc(ch.id)}" aria-pressed="${done}">
            ${done ? "✓ Read" : "Mark as read"}
          </button>
        </div>
      </header>
      <section class="summary">${paras(ch.summary)}</section>
      <section class="passages">
        <h2>Key passages</h2>
        ${ch.passages.map(renderPassage).join("")}
      </section>
      ${ch.subtopics.map(renderSubtopic).join("")}
      <section class="qa">
        <h2>Questions &amp; reflection</h2>
        ${ch.questions.map(renderQuestion).join("")}
      </section>
      ${chapterNav(ch)}
    </article>`;
}

function renderHome() {
  const total = book.chapters.length;
  const readCount = book.chapters.filter((c) => store.isComplete(c.id)).length;
  const pct = total ? Math.round((readCount / total) * 100) : 0;
  const firstUnread = book.chapters.find((c) => !store.isComplete(c.id)) || book.chapters[0];
  const startLabel = readCount === 0 ? "Begin reading" : readCount === total ? "Re-read from the start" : "Continue reading";
  const startSlug = readCount === total ? book.chapters[0].slug : firstUnread.slug;

  const cards = book.chapters
    .map((c) => {
      const cdone = store.isComplete(c.id);
      return `
      <li>
        <a class="chapter-card${cdone ? " done" : ""}" href="#/chapter/${esc(c.slug)}">
          <span class="card-num">${esc(c.number)}</span>
          <span class="card-body">
            <span class="card-title">${esc(c.title)}</span>
            <span class="card-sub">${esc(c.subtitle)}</span>
            <span class="card-meta">${c.passages.length} passages · ${c.questions.length} questions${cdone ? " · <span class=\"read-badge\">Read</span>" : ""}</span>
          </span>
          <span class="card-arrow" aria-hidden="true">→</span>
        </a>
      </li>`;
    })
    .join("");

  return `
    <section class="home">
      <div class="hero">
        <p class="hero-eyebrow">${esc(book.edition)}</p>
        <h1>${esc(book.title)}</h1>
        <p class="hero-sub">${esc(book.subtitle)}</p>
        <p class="hero-tag">${esc(book.tagline)}</p>
        <div class="progress-summary" role="group" aria-label="Reading progress">
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <p class="progress-text">${readCount} of ${total} chapters read</p>
        </div>
        <a class="btn primary" href="#/chapter/${esc(startSlug)}">${startLabel}</a>
      </div>

      <h2 class="contents-title">Contents</h2>
      <ol class="chapter-cards">${cards}</ol>

      <section class="about-inline">
        <h2>About this study</h2>
        <p>${esc(book.translation.note)}</p>
        <p>Your reading progress and reflection notes are saved only in this browser, on this device. Nothing is uploaded.</p>
        <p><a href="#/about">More about this book →</a></p>
      </section>
    </section>`;
}

function renderAbout() {
  return `
    <article class="page about">
      <h1>About this book</h1>
      <p>${esc(book.title)} — ${esc(book.subtitle)}. It is a short, interactive study of the human condition, built around three questions:</p>
      <ol class="about-questions">
        ${book.chapters.map((c) => `<li><a href="#/chapter/${esc(c.slug)}">${esc(c.title)}</a></li>`).join("")}
      </ol>
      <h2>Scripture</h2>
      <p>${esc(book.translation.note)} The default translation is the ${esc(book.translation.name)} (${esc(book.translation.code)}).</p>
      <h2>Your data</h2>
      <p>This is an offline-capable Progressive Web App. It can be installed to your home screen and read without a connection. Reading progress and reflection notes live in this browser's local storage on your device only — they are never sent anywhere.</p>
      <h2>Source</h2>
      <p>The content and code are open. <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">View the repository ↗</a></p>
      <p><a href="#/">← Back to contents</a></p>
    </article>`;
}

function renderNotFound() {
  return `<article class="page"><h1>Page not found</h1><p>That page doesn't exist. <a href="#/">Return to contents →</a></p></article>`;
}

/* ----------------------------------------------------------------- router */
function parseHash() {
  const h = location.hash.replace(/^#/, "");
  if (h === "" || h === "/" ) return { name: "home" };
  const parts = h.split("/").filter(Boolean); // ["chapter","slug","section?"]
  if (parts[0] === "chapter" && parts[1]) {
    return { name: "chapter", slug: parts[1], section: parts[2] || null };
  }
  if (parts[0] === "about") return { name: "about" };
  return { name: "notfound" };
}

function setActiveToc(slug) {
  document.querySelectorAll(".toc-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.slug === slug);
    if (a.dataset.slug === slug) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function render() {
  const route = parseHash();
  const view = $("#view");
  let title = book.title;

  if (route.name === "home") {
    view.innerHTML = renderHome();
    setActiveToc(null);
  } else if (route.name === "about") {
    view.innerHTML = renderAbout();
    setActiveToc(null);
    title = "About · " + book.title;
  } else if (route.name === "chapter") {
    const ch = chapterBySlug(route.slug);
    if (!ch) {
      view.innerHTML = renderNotFound();
    } else {
      view.innerHTML = renderChapter(ch);
      setActiveToc(ch.slug);
      hydrateNotes(view);
      title = `${ch.title} · ${book.title}`;
    }
  } else {
    view.innerHTML = renderNotFound();
    setActiveToc(null);
  }

  document.title = title;
  closeNav();

  // Scroll: to a named section if given, else to top of the view.
  if (route.name === "chapter" && route.section) {
    const target = document.getElementById(route.section);
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      target.classList.add("flash");
      setTimeout(() => target.classList.remove("flash"), 1200);
    } else {
      window.scrollTo(0, 0);
    }
  } else {
    window.scrollTo(0, 0);
  }
  view.focus({ preventScroll: true });
  updateReadingBar();
}

/* Populate reflection textareas from storage (set as property, not markup). */
function hydrateNotes(root) {
  root.querySelectorAll("textarea.note").forEach((ta) => {
    ta.value = store.getNote(ta.dataset.qid);
  });
}

/* --------------------------------------------------------------- sidebar */
function buildToc() {
  const items = book.chapters
    .map(
      (c) => `
      <li>
        <a class="toc-link" href="#/chapter/${esc(c.slug)}" data-slug="${esc(c.slug)}">
          <span class="toc-num">${esc(c.number)}</span>
          <span class="toc-text">
            <span class="toc-title">${esc(c.title)}</span>
            <span class="toc-sub">${esc(c.subtitle)}</span>
          </span>
          <span class="toc-dot${store.isComplete(c.id) ? " done" : ""}" data-id="${esc(c.id)}" title="Read" aria-hidden="true"></span>
        </a>
      </li>`
    )
    .join("");
  $("#toc").innerHTML = `
    <p class="toc-heading"><a href="#/">${esc(book.title)}</a></p>
    <ol class="toc-list">${items}</ol>
    <p class="toc-foot"><a href="#/about">About</a></p>`;
}

function refreshDots() {
  document.querySelectorAll(".toc-dot").forEach((d) => {
    d.classList.toggle("done", store.isComplete(d.dataset.id));
  });
}

/* ------------------------------------------------------------------ nav (mobile) */
function openNav() {
  document.body.classList.add("nav-open");
  $("#menu-toggle").setAttribute("aria-expanded", "true");
}
function closeNav() {
  document.body.classList.remove("nav-open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
}

/* --------------------------------------------------------------- search */
function buildIndex() {
  const idx = [];
  for (const c of book.chapters) {
    const base = { slug: c.slug, chapter: c.title };
    idx.push({ ...base, kind: "Chapter", label: c.title, sub: c.subtitle, text: `${c.subtitle} ${c.summary.join(" ")}`, hash: `#/chapter/${c.slug}` });
    for (const s of c.subtopics) {
      idx.push({ ...base, kind: "Section", label: s.heading, sub: c.title, text: s.body.join(" "), hash: `#/chapter/${c.slug}/${s.id}` });
    }
    for (const p of c.passages) {
      idx.push({ ...base, kind: "Passage", label: p.ref, sub: c.title, text: p.verses.map((v) => v.t).join(" "), hash: `#/chapter/${c.slug}` });
    }
    for (const q of c.questions) {
      idx.push({ ...base, kind: q.type === "reflection" ? "Reflection" : "Question", label: q.q, sub: c.title, text: `${q.q} ${q.a || ""}`, hash: `#/chapter/${c.slug}` });
    }
  }
  return idx;
}

function snippet(text, query) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text.slice(0, 90) + (text.length > 90 ? "…" : "");
  const start = Math.max(0, i - 35);
  const end = Math.min(text.length, i + query.length + 45);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

let SEARCH_INDEX = [];
function runSearch(query) {
  const results = $("#search-results");
  const q = query.trim();
  if (q.length < 2) {
    results.hidden = true;
    results.innerHTML = "";
    return [];
  }
  const ql = q.toLowerCase();
  const matches = SEARCH_INDEX.filter((e) => (e.label + " " + e.text).toLowerCase().includes(ql)).slice(0, 8);
  if (!matches.length) {
    results.innerHTML = `<p class="search-empty">No matches for “${esc(q)}”.</p>`;
  } else {
    results.innerHTML = matches
      .map(
        (m) => `
        <a class="search-result" href="${esc(m.hash)}">
          <span class="sr-kind">${esc(m.kind)}</span>
          <span class="sr-label">${esc(m.label)}</span>
          <span class="sr-snip">${esc(snippet(m.text, q))}</span>
        </a>`
      )
      .join("");
  }
  results.hidden = false;
  return matches;
}

/* ------------------------------------------------------- reading progress bar */
function updateReadingBar() {
  const bar = $("#progress-bar");
  if (!bar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
  bar.style.width = pct + "%";
}

/* --------------------------------------------------------------- toast */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 250);
  }, 1800);
}

/* --------------------------------------------------------------- theme */
function updateThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const c = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
  if (c) meta.setAttribute("content", c);
}
function updateThemeButton() {
  const btn = $("#theme-toggle");
  const cur = store.getTheme();
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effectiveDark = cur ? cur === "dark" : sysDark;
  btn.textContent = effectiveDark ? "☀" : "☾";
  btn.setAttribute("aria-label", effectiveDark ? "Switch to light theme" : "Switch to dark theme");
}
function applyTheme() {
  const t = store.getTheme();
  const root = document.documentElement;
  if (t) root.setAttribute("data-theme", t);
  else root.removeAttribute("data-theme");
  updateThemeButton();
  updateThemeColor();
}

/* --------------------------------------------------------- install (PWA) */
let deferredPrompt = null;
function setupInstall() {
  const btn = $("#install-btn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.hidden = false;
  });
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    btn.hidden = true;
    toast("Installed — find it on your home screen");
  });
}

/* ------------------------------------------------------- service worker */
function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      location.reload();
    });
    try {
      await navigator.serviceWorker.register(new URL("sw.js", document.baseURI).href);
    } catch {
      /* App still works online without the service worker. */
    }
  });
}

/* ------------------------------------------------------------------ wire up */
function setupEvents() {
  // Delegated clicks within the main view.
  $("#view").addEventListener("click", (e) => {
    const mark = e.target.closest(".mark-complete");
    if (mark) {
      const id = mark.dataset.id;
      const nowDone = !store.isComplete(id);
      store.setComplete(id, nowDone);
      mark.classList.toggle("done", nowDone);
      mark.setAttribute("aria-pressed", String(nowDone));
      mark.textContent = nowDone ? "✓ Read" : "Mark as read";
      refreshDots();
      toast(nowDone ? "Marked as read" : "Marked as unread");
    }
  });

  // Reflection notes — debounced save.
  const noteTimers = new Map();
  $("#view").addEventListener("input", (e) => {
    const ta = e.target.closest("textarea.note");
    if (!ta) return;
    const qid = ta.dataset.qid;
    const status = document.querySelector(`.note-status[data-for="${CSS.escape(qid)}"]`);
    clearTimeout(noteTimers.get(qid));
    noteTimers.set(
      qid,
      setTimeout(() => {
        store.setNote(qid, ta.value);
        if (status) {
          status.textContent = ta.value.trim() ? "Saved ✓" : "";
          status.classList.add("visible");
          setTimeout(() => status.classList.remove("visible"), 1500);
        }
      }, 400)
    );
  });

  // Theme.
  $("#theme-toggle").addEventListener("click", () => {
    const cur = store.getTheme();
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effective = cur || (sysDark ? "dark" : "light");
    store.setTheme(effective === "dark" ? "light" : "dark");
    applyTheme();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!store.getTheme()) applyTheme();
  });

  // Mobile nav.
  $("#menu-toggle").addEventListener("click", () => {
    document.body.classList.contains("nav-open") ? closeNav() : openNav();
  });
  $("#backdrop").addEventListener("click", closeNav);

  // Search.
  const search = $("#search");
  const results = $("#search-results");
  search.addEventListener("input", () => runSearch(search.value));
  search.addEventListener("focus", () => {
    if (search.value.trim().length >= 2) runSearch(search.value);
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      search.value = "";
      results.hidden = true;
      search.blur();
    } else if (e.key === "Enter") {
      const first = results.querySelector(".search-result");
      if (first) {
        location.hash = first.getAttribute("href").slice(1);
        search.value = "";
        results.hidden = true;
        search.blur();
      }
    }
  });
  results.addEventListener("click", (e) => {
    if (e.target.closest(".search-result")) {
      search.value = "";
      results.hidden = true;
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) results.hidden = true;
  });

  // Routing + scroll.
  window.addEventListener("hashchange", render);
  window.addEventListener("scroll", updateReadingBar, { passive: true });
  window.addEventListener("resize", updateReadingBar);
}

/* ------------------------------------------------------------------ init */
function init() {
  applyTheme();
  buildToc();
  SEARCH_INDEX = buildIndex();
  setupEvents();
  setupInstall();
  render();
  registerSW();
}

init();
