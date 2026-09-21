"use strict";

/* ==========================================================================
   Tribal Doctor — identify.js

   BACKEND CONTRACT (unchanged from the original script — do not edit)
   -----------------------------------------------------------------
   POST  <API_URL>          multipart/form-data, ONE field named "file"
   OK    { success: true, matches: [{ english_name, scientific_name,
                                      confidence, hindi_name,
                                      wikipedia? }, ...] }
   Error { detail: "message" }   (non-2xx)

   - API_URL is http://localhost:8000/identify, as before. The only addition:
     if this page is itself served from port 8000 (e.g. FastAPI serving the
     frontend) it uses the same-origin path "/identify", which avoids CORS.
   - matches[0] is the best match. Fields are read exactly as before:
     english_name, scientific_name, confidence (rounded), hindi_name.
   - "wikipedia" is OPTIONAL. If the backend sends it
     ({ english: {title, description, extract, url}, hindi: {...} })
     the English / Hindi notes appear as text in the card. Either way, the
     "Explore this plant" button always links out to Wikipedia — the
     backend's url when there is one, otherwise a Wikipedia search built
     client-side from the plant's name — so it works even when the backend
     sends no wikipedia field.

   Everything else in this file (navbar, mobile menu, magnetic buttons,
   motion) is presentation and does not touch the request/response above.
   ========================================================================== */

const API_URL =
  location.port === "8000" ? "/identify" : "http://localhost:8000/identify";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MATCHES = 4; // best match + up to 3 alternatives
const MIN_SCAN_MS = 900; // keep the scan visible even when the backend is fast
const REQUEST_TIMEOUT_MS = 120000;

const DEMO = new URLSearchParams(location.search).has("demo"); // ?demo = sample data, no backend
const HAS_GSAP = typeof window.gsap !== "undefined";
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, REDUCE ? 0 : ms));

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

/* only ever link out to https pages */
const safeUrl = (url) => (typeof url === "string" && /^https:\/\//i.test(url) ? url : "");

/* ---------- Elements ---------- */
const navbar = $("#navbar");
const hamburger = $("#hamburger");
const mobileMenu = $("#mobileMenu");
const hero = $("#hero");
const drop = $("#drop");
const fileInput = $("#plantImageInput");
const stage = $("#stage");
const frameWrap = $("#previewContainer");
const preview = $("#plantPreview");
const againButton = $("#again");
const statusEl = $("#status");
const resultsEl = $("#results");
const toast = $("#toast");

/* ---------- State ---------- */
let busy = false;
let previewUrl = null;
let matches = [];

const setState = (state) => {
  stage.dataset.state = state;
};

/* ==========================================================================
   0. Navbar — shared chrome with the landing page (same class names as
      script.js/style.css: "scrolled" + "nav-hidden" on the navbar, "open" on
      the mobile menu, "menu-open" on the body).
   ========================================================================== */
function setMobileMenu(open) {
  if (!mobileMenu || !hamburger) return;
  mobileMenu.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.style.overflow = open ? "hidden" : "";
}

function closeMobileMenu() {
  setMobileMenu(false);
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    setMobileMenu(!mobileMenu.classList.contains("open"));
  });

  $$("a", mobileMenu).forEach((link) => link.addEventListener("click", closeMobileMenu));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });

  window.matchMedia("(min-width: 769px)").addEventListener("change", (event) => {
    if (event.matches) closeMobileMenu();
  });
}

if (navbar) {
  let lastScrollY = scrollY;

  const updateNavbar = () => {
    const y = scrollY;

    if (y <= 40) {
      navbar.classList.remove("nav-hidden", "scrolled");
      lastScrollY = y;
      return;
    }

    navbar.classList.add("scrolled");

    if (y > lastScrollY && y > 100) {
      navbar.classList.add("nav-hidden");
    } else if (y < lastScrollY) {
      navbar.classList.remove("nav-hidden");
    }

    lastScrollY = y;
  };

  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });
}

/* ==========================================================================
   1. Motion (GSAP) — optional. Nothing below is needed for identification.
   ========================================================================== */
function introSequence() {
  /* split each headline line into masked words for the reveal */
  $$(".ln").forEach((line) => {
    const target = line.querySelector("em") || line;
    target.innerHTML = target.textContent
      .trim()
      .split(/\s+/)
      .map((word) => `<span class="w"><span>${esc(word)}</span></span>`)
      .join(" ");
  });

  gsap
    .timeline({ defaults: { ease: "power4.out" } })
    .from(".logo, .nav-links a", { y: -18, opacity: 0, duration: 0.8, stagger: 0.08 })
    .from(".eyebrow", { opacity: 0, x: -20, duration: 0.9 }, 0.15)
    .from(".w > span", { yPercent: 118, rotate: 5, duration: 1.15, stagger: 0.08 }, 0.25)
    .from(".leaf svg", { scale: 0, opacity: 0, duration: 1.6, stagger: 0.15, ease: "back.out(1.7)" }, 0.3)
    .from(".sub", { opacity: 0, y: 18, duration: 0.9 }, 0.95)
    .from(".tip", { opacity: 0, x: -14, duration: 0.6, stagger: 0.1 }, 1.15)
    .from(
      "#drop",
      { opacity: 0, y: 70, scale: 0.92, rotationX: 14, transformPerspective: 900, duration: 1.3 },
      0.8
    );
}

function ambientMotion() {
  /* leaves drift */
  $$(".leaf svg").forEach((leaf, i) => {
    gsap.to(leaf, {
      y: gsap.utils.random(-28, 28),
      rotation: "+=" + gsap.utils.random(-22, 22),
      duration: gsap.utils.random(4, 7),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2 + i * 0.3,
    });
  });

  /* soft glow + parallax that follow the pointer */
  const glow = $(".glow");
  gsap.set(glow, { opacity: 0 });

  const glowX = gsap.quickTo(glow, "x", { duration: 1.3, ease: "power3" });
  const glowY = gsap.quickTo(glow, "y", { duration: 1.3, ease: "power3" });

  const layers = $$(".leaf").map((el) => ({
    x: gsap.quickTo(el, "x", { duration: 1.6, ease: "power3" }),
    y: gsap.quickTo(el, "y", { duration: 1.6, ease: "power3" }),
    depth: Number(el.dataset.d) || 0,
  }));

  let glowShown = false;

  window.addEventListener("pointermove", (event) => {
    if (!glowShown) {
      glowShown = true;
      gsap.to(glow, { opacity: 1, duration: 1.2 });
    }

    const nx = event.clientX / innerWidth - 0.5;
    const ny = event.clientY / innerHeight - 0.5;

    glowX(event.clientX - 310);
    glowY(event.clientY - 310);

    layers.forEach((layer) => {
      layer.x(nx * layer.depth);
      layer.y(ny * layer.depth);
    });
  });
}

function dropZoneMotion() {
  const button = $(".btn", drop);
  const btnX = gsap.quickTo(button, "x", { duration: 0.5, ease: "power3" });
  const btnY = gsap.quickTo(button, "y", { duration: 0.5, ease: "power3" });

  drop.addEventListener("pointermove", (event) => {
    const box = drop.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;

    gsap.to(drop, {
      rotationY: px * 7,
      rotationX: -py * 7,
      transformPerspective: 900,
      duration: 0.6,
      ease: "power2.out",
    });

    const b = button.getBoundingClientRect();
    btnX((event.clientX - (b.left + b.width / 2)) * 0.3);
    btnY((event.clientY - (b.top + b.height / 2)) * 0.3);
  });

  drop.addEventListener("pointerleave", () => {
    gsap.to(drop, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
    btnX(0);
    btnY(0);
  });
}

/* magnetic buttons — the same hover language as the landing page's
   [data-magnetic] links/buttons (nav CTA, "Try another photo", etc.) */
function magneticButtons() {
  if (!window.matchMedia("(hover: hover)").matches) return;

  $$("[data-magnetic]").forEach((el) => {
    const inner = el.querySelector("span") || el;
    const moveX = gsap.quickTo(inner, "x", { duration: 0.4, ease: "power3" });
    const moveY = gsap.quickTo(inner, "y", { duration: 0.4, ease: "power3" });

    el.addEventListener("pointermove", (event) => {
      const box = el.getBoundingClientRect();
      moveX((event.clientX - (box.left + box.width / 2)) * 0.35);
      moveY((event.clientY - (box.top + box.height / 2)) * 0.35);
    });

    el.addEventListener("pointerleave", () => {
      gsap.to(inner, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    });
  });
}

if (HAS_GSAP && !REDUCE) {
  introSequence();
  ambientMotion();
  magneticButtons();
  if (window.matchMedia("(hover: hover)").matches) dropZoneMotion();
} else {
  document.documentElement.classList.remove("js");
}

/* ==========================================================================
   2. Small UI helpers
   ========================================================================== */
function showToast(message, duration = 6000) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), duration);
}

function shake(element) {
  element.classList.remove("shake");
  void element.offsetWidth; // restart the animation
  element.classList.add("shake");
  element.addEventListener("animationend", () => element.classList.remove("shake"), { once: true });
}

function ping() {
  frameWrap.classList.remove("ping");
  void frameWrap.offsetWidth;
  frameWrap.classList.add("ping");
  $(".ring", frameWrap).addEventListener("animationend", () => frameWrap.classList.remove("ping"), { once: true });
}

/* rotating status line while the backend works */
const STATUS_LINES = [
  "Reading the leaf's shape",
  "Comparing with known plants",
  "Looking up common names",
  "Gathering what is documented",
];
let statusTimer = null;
let statusIndex = 0;

function setStatus(text) {
  statusEl.textContent = text;
  statusEl.classList.remove("swap");
  void statusEl.offsetWidth;
  statusEl.classList.add("swap");
}

function startStatus() {
  statusIndex = 0;
  setStatus(STATUS_LINES[0]);
  statusTimer = setInterval(() => {
    statusIndex += 1;
    setStatus(STATUS_LINES[statusIndex % STATUS_LINES.length]);
  }, 1900);
}

function stopStatus() {
  clearInterval(statusTimer);
  statusTimer = null;
}

/* ==========================================================================
   3. Choosing a photo (click, keyboard or drag and drop)
   ========================================================================== */
fileInput.addEventListener("change", () => handle(fileInput.files[0]));

["dragenter", "dragover"].forEach((type) =>
  drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.add("is-dragover");
  })
);

["dragleave", "drop"].forEach((type) =>
  drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragover");
  })
);

drop.addEventListener("drop", (event) => handle(event.dataTransfer.files[0]));

/* stop the browser opening a file that's dropped outside the drop zone */
["dragover", "drop"].forEach((type) =>
  window.addEventListener(type, (event) => event.preventDefault())
);

againButton.addEventListener("click", reset);

/* ==========================================================================
   4. The flow: hero → scanning → results
   ========================================================================== */
async function handle(file) {
  if (!file || busy) return;

  if (!ACCEPTED_TYPES.includes(file.type)) {
    shake(drop);
    showToast("Please choose a JPG, PNG or WebP photo.");
    fileInput.value = "";
    return;
  }

  busy = true;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;

  /* clear the input so choosing the same photo again still fires "change" */
  fileInput.value = "";

  try {
    await showStage();
    setState("loading");
    startStatus();

    let outcome;
    try {
      const [data] = await Promise.all([identify(file), wait(MIN_SCAN_MS)]);
      outcome = { data };
    } catch (error) {
      outcome = { error };
    }

    stopStatus();
    ping();

    if (outcome.error) {
      console.error(outcome.error);
      fail(outcome.error.message);
    } else {
      render(outcome.data);
    }
  } finally {
    busy = false;
  }
}

async function showStage() {
  hero.classList.add("is-leaving");
  await wait(520);

  hero.hidden = true;
  hero.classList.remove("is-leaving", "is-entering");

  setState("idle");
  stage.hidden = false;
  window.scrollTo({ top: 0 });
}

async function reset() {
  if (busy) return;

  stage.classList.add("is-leaving");
  await wait(450);

  stage.hidden = true;
  stage.classList.remove("is-leaving");
  setState("idle");

  resultsEl.innerHTML = "";
  matches = [];
  preview.removeAttribute("src");
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  fileInput.value = "";

  hero.hidden = false;
  hero.classList.add("is-entering");
  hero.addEventListener("animationend", () => hero.classList.remove("is-entering"), { once: true });
  window.scrollTo({ top: 0 });
}

/* ==========================================================================
   5. Talking to the backend — same request and same checks as before
   ========================================================================== */
function readDetail(data) {
  if (!data || !data.detail) return "";
  if (typeof data.detail === "string") return data.detail;

  /* FastAPI validation errors arrive as an array of { msg } objects */
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => (item && item.msg) || "")
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

async function identify(file) {
  if (DEMO) {
    await wait(2600);
    return MOCK;
  }

  const formData = new FormData();
  formData.append("file", file);

  /* if the page reloads mid-request (e.g. a live-reload dev server) the answer is lost; flag it */
  try {
    sessionStorage.setItem("td_pending", "1");
  } catch (e) {
    /* storage unavailable: skip */
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    clearPending();
    if (error.name === "AbortError") {
      throw new Error("The backend took longer than two minutes to answer. Check its terminal for errors.");
    }
    throw new Error("Can't reach the identification service at " + API_URL + ". Start the backend and try again.");
  } finally {
    clearTimeout(timer);
  }

  clearPending();

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null; // a non-JSON body shouldn't hide the real HTTP error
  }

  if (!response.ok) {
    throw new Error(readDetail(data) || "Identification failed.");
  }

  if (!data || !data.success || !Array.isArray(data.matches) || data.matches.length === 0) {
    throw new Error((data && data.message) || "No plant could be identified.");
  }

  return data;
}

function clearPending() {
  try {
    sessionStorage.removeItem("td_pending");
  } catch (e) {
    /* storage unavailable: skip */
  }
}

/* if the last visit ended mid-request, say so instead of failing silently */
try {
  if (sessionStorage.getItem("td_pending")) {
    sessionStorage.removeItem("td_pending");
    setTimeout(
      () =>
        showToast(
          "The page reloaded while your photo was being identified, so the result was lost. If you use a live-reload dev server, open the app from the backend address instead.",
          9000
        ),
      1200
    );
  }
} catch (e) {
  /* storage unavailable: skip */
}

/* ==========================================================================
   6. Rendering results
   ========================================================================== */
const RING_RADIUS = 36;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/* the plant name to search Wikipedia for when the backend gives no notes,
   or when the person switches to a language the backend didn't cover */
function wikiQueryFor(match) {
  return match.scientific_name || match.english_name || "";
}

function wikiSearchUrl(query, isHindi) {
  const host = isHindi ? "hi.wikipedia.org" : "en.wikipedia.org";
  return `https://${host}/w/index.php?search=${encodeURIComponent(query)}&fulltext=1`;
}

function wikiHtml(note, lang, fallbackQuery) {
  const isHindi = lang === "hindi";

  if (!note) {
    return `<p class="ex" lang="${isHindi ? "hi" : "en"}">No ${
      isHindi ? "Hindi" : "English"
    } Wikipedia article was found for this plant. Use "Explore this plant" to search Wikipedia directly.</p>`;
  }

  return `${note.description ? `<div class="d">${esc(note.description)}</div>` : ""}
    <p class="ex" lang="${isHindi ? "hi" : "en"}">${esc(note.extract || "No summary available.")}</p>`;
}

/* where "Explore this plant" sends the person for a given language: the
   backend's own Wikipedia url when there is one, otherwise a Wikipedia
   search built from the plant's name */
function exploreUrlFor(match, lang) {
  const isHindi = lang === "hindi";
  const note = match.wikipedia ? match.wikipedia[lang] : null;
  const direct = note && safeUrl(note.url);
  return direct || wikiSearchUrl(wikiQueryFor(match), isHindi);
}

function cardHtml(match, index) {
  const scientific = match.scientific_name;
  const name = match.english_name || "Unknown plant";
  const percent = Math.round(match.confidence || 0);
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = RING_LENGTH * (1 - clamped / 100);

  const notes = match.wikipedia || null;
  const hasNotes = !!(notes && (notes.english || notes.hindi));
  const lang = notes && notes.english ? "english" : "hindi";
  const query = wikiQueryFor(match);
  const exploreUrl = exploreUrlFor(match, lang);

  return `<article class="card ${index === 0 ? "best" : ""}" data-i="${index}" style="--i:${index}">
    ${index === 0 ? '<span class="badge">Best match</span>' : ""}
    <div class="top">
      <div class="ident">
        <h3 class="nm">${esc(name)}</h3>
        ${
          match.hindi_name
            ? `<div class="hi" lang="hi">${esc(match.hindi_name)}</div>`
            : `<div class="hi none">Hindi name unavailable</div>`
        }
        ${
          scientific
            ? `<div class="sci">${esc(scientific)}</div>`
            : `<div class="sci none">Scientific name unavailable</div>`
        }
      </div>
      <div class="conf" role="img" aria-label="Confidence ${percent} percent">
        <svg viewBox="0 0 88 88" fill="none" aria-hidden="true">
          <circle cx="44" cy="44" r="${RING_RADIUS}" stroke="rgba(29,33,29,.12)" stroke-width="7"/>
          <circle class="arc" cx="44" cy="44" r="${RING_RADIUS}" stroke="#173b2a" stroke-width="7"
            stroke-linecap="round" transform="rotate(-90 44 44)"
            stroke-dasharray="${RING_LENGTH}" stroke-dashoffset="${RING_LENGTH}" data-off="${offset}"/>
        </svg>
        <span class="num"><span><b class="pct" data-v="${percent}">0</b><small>%</small></span></span>
      </div>
    </div>
    ${
      hasNotes
        ? `<div class="tgs">
            <button type="button" class="tg ${lang === "english" ? "on" : ""}" data-l="english" ${notes.english ? "" : "disabled"}>English</button>
            <button type="button" class="tg ${lang === "hindi" ? "on" : ""}" data-l="hindi" lang="hi" ${notes.hindi ? "" : "disabled"}>हिन्दी</button>
          </div>
          <div class="wk">${wikiHtml(notes[lang], lang, query)}</div>`
        : ""
    }
    <div class="card-actions">
      ${
        query
          ? `<a class="explore" href="${esc(exploreUrl)}" target="_blank" rel="noopener">Explore this plant ↗</a>`
          : ""
      }
    </div>
  </article>`;
}

function render(data) {
  matches = data.matches.slice(0, MAX_MATCHES);
  resultsEl.innerHTML = matches.map(cardHtml).join("");
  setState("success");
  animateConfidence();
  if (HAS_GSAP && !REDUCE) magneticButtons();

  /* on small screens the results sit below the photo, so bring them into view */
  if (innerWidth < 860) {
    setTimeout(() => {
      const top = resultsEl.getBoundingClientRect().top + scrollY - 88;
      window.scrollTo({ top, behavior: REDUCE ? "auto" : "smooth" });
    }, 400);
  }
}

function animateConfidence() {
  /* wait two frames so the ring transitions from its starting position */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      $$(".arc", resultsEl).forEach((arc) => {
        arc.style.strokeDashoffset = arc.dataset.off;
      });
    })
  );

  $$(".pct", resultsEl).forEach((el, i) => countUp(el, Number(el.dataset.v) || 0, 350 + i * 200));
}

function countUp(el, target, delay) {
  if (REDUCE) {
    el.textContent = target;
    return;
  }

  const duration = 1500;

  setTimeout(() => {
    const start = performance.now();

    (function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    })(start);
  }, delay);
}

function fail(message) {
  resultsEl.innerHTML = `<article class="card err" role="alert">
    <h3>We couldn't identify this plant</h3>
    <p>${esc(message)}</p>
    <p>Try a sharper photo of a single leaf, in daylight, against a plain background.</p>
  </article>`;

  setState("error");
  shake($(".err", resultsEl));
}

/* English / Hindi notes toggle (only present when the backend sends "wikipedia") */
resultsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".tg");
  if (!button || button.disabled || button.classList.contains("on")) return;

  const card = button.closest(".card");
  const lang = button.dataset.l;
  const box = $(".wk", card);
  const match = matches[Number(card.dataset.i)];
  const notes = match?.wikipedia;

  $$(".tg", card).forEach((tab) => tab.classList.toggle("on", tab === button));

  box.innerHTML = wikiHtml(notes ? notes[lang] : null, lang, match ? wikiQueryFor(match) : "");
  box.classList.remove("swap");
  void box.offsetWidth;
  box.classList.add("swap");

  const explore = $(".explore", card);
  if (explore && match) explore.href = exploreUrlFor(match, lang);
});

/* ==========================================================================
   7. Demo data — only used when the page is opened with ?demo
   ========================================================================== */
const MOCK = {
  success: true,
  matches: [
    {
      scientific_name: "Withania somnifera",
      english_name: "Ashwagandha",
      hindi_name: "अश्वगंधा",
      confidence: 87.4,
      wikipedia: {
        english: {
          title: "Withania somnifera",
          description: "Species of flowering plant",
          extract:
            "A small evergreen shrub of the nightshade family, native to India and parts of Africa and Asia, long used in traditional Ayurvedic practice.",
          url: "https://en.wikipedia.org/wiki/Withania_somnifera",
        },
        hindi: null,
      },
    },
    {
      scientific_name: "Tinospora cordifolia",
      english_name: "Giloy",
      hindi_name: "गिलोय",
      confidence: 58.1,
      wikipedia: null,
    },
    {
      scientific_name: "Ocimum tenuiflorum",
      english_name: "Holy Basil",
      hindi_name: "तुलसी",
      confidence: 31.6,
      wikipedia: null,
    },
  ],
};