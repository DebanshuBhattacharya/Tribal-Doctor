/* Tribal Doctor — Communities. GSAP + ScrollTrigger.
   Sections: images, loader/nav, hero (pinned iris), why (word scrub), help (pinned stack),
   places (pinned horizontal), voices (pinned), passport, how (pinned), faq, closing, dialog. */
(function () {
  "use strict";
  /* Image library. Swap URLs here. If an image fails it tries its FALLBACK once, then hides and the colour behind shows.
     Replace the hotlinked sun / hills / gather images with licensed, self-hosted files when you can. */
  const IMG = {
    leaf: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=85",
    roots: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=85",
    gather: "https://static.wixstatic.com/media/f33613_638bf19a659a45d9ad0f91154b64f20a~mv2.png/v1/fill/w_1000,h_563,al_c,q_90,usm_0.66_1.00_0.01/f33613_638bf19a659a45d9ad0f91154b64f20a~mv2.png",
    sun: "https://st3.depositphotos.com/2977105/17879/i/450/depositphotos_178799202-stock-photo-beautiful-rays-sunlight-dense-forest.jpg?forcejpeg=true",
    hills: "https://www.sanctuarynaturefoundation.org/uploads/Article/ADITYA%20CHANDRA%20PANDA_PALAMU%20landscape%20winter_24_1629355046.jpg",
    leaf2: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=85",
    forest: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=85",
    prep: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=85",
    digital: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=85"
  };
  const FALLBACK = { sun: "forest", hills: "leaf", gather: "leaf2" };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const can = !!(window.gsap && window.ScrollTrigger) && !reduced;
  if (!can) root.classList.remove("js"); else { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }

  /* images */
  $$("img[data-img]").forEach((img) => {
    const key = img.dataset.img;
    img.decoding = "async";
    img.addEventListener("error", () => {
      const fb = FALLBACK[key];
      if (fb && IMG[fb] && !img.dataset.fb) { img.dataset.fb = "1"; img.src = IMG[fb]; }
      else img.style.visibility = "hidden";
    });
    if (IMG[key]) img.src = IMG[key]; else img.style.visibility = "hidden";
  });
  $$(".draw").forEach((p) => p.setAttribute("pathLength", "1"));

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  /* Splits into words for animation. One screen-reader-only copy keeps the text readable; the animated words are hidden from AT. */
  function split(el) {
    const t = el.textContent.trim();
    el.innerHTML = `<span class="cm-sr">${esc(t)}</span>` + t.split(/\s+/).map((w) => `<span class="cm-w" aria-hidden="true"><span class="cm-wi">${esc(w)}</span></span>`).join(" ");
    return $$(".cm-wi", el);
  }

  /* nav + menu */
  (function () {
    const nav = $("#navbar"); let last = scrollY, tick = false;
    const up = () => { const y = scrollY; if (y <= 40) nav.classList.remove("nav-hidden", "scrolled"); else { nav.classList.add("scrolled"); if (y > last && y > 100) nav.classList.add("nav-hidden"); else if (y < last) nav.classList.remove("nav-hidden"); } last = y; tick = false; };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(up); } }, { passive: true }); up();
    const b = $("#hamburger"), m = $("#mobileMenu"); let open = false;
    m.inert = true; /* closed menu links must not be tabbable */
    const set = (v) => { open = v; m.inert = !v; m.classList.toggle("open", v); document.body.classList.toggle("menu-open", v); b.setAttribute("aria-expanded", String(v)); b.setAttribute("aria-label", v ? "Close menu" : "Open menu"); document.body.style.overflow = v ? "hidden" : ""; };
    b.addEventListener("click", () => set(!open));
    $$("a", m).forEach((a) => a.addEventListener("click", () => open && set(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { set(false); b.focus(); } });
    /* resizing to desktop while the menu is open would leave the page scroll-locked */
    addEventListener("resize", () => { if (open && getComputedStyle(b).display === "none") set(false); });
  })();

  /* marquee: repeat 4x and travel one quarter, so wide screens never see a gap */
  const mq = $(".strip-track");
  if (mq && !reduced) {
    const n = mq.children.length;
    mq.innerHTML = mq.innerHTML.repeat(4);
    $$("span", mq).slice(n).forEach((s) => s.setAttribute("aria-hidden", "true"));
  }

  /* in-page links: smooth scroll in JS (CSS scroll-behavior:smooth breaks ScrollTrigger refreshes) */
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1), t = id && document.getElementById(id);
    if (!t || a.classList.contains("cm-skip")) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: reduced ? "auto" : "smooth" });
    history.pushState(null, "", "#" + id);
  }));

  /* cursor dot + magnetic buttons */
  if (can && fine) {
    const dot = $("#cursorDot"); gsap.set(dot, { xPercent: -50, yPercent: -50 });
    const qx = gsap.quickTo(dot, "x", { duration: .25, ease: "power3" }), qy = gsap.quickTo(dot, "y", { duration: .25, ease: "power3" });
    addEventListener("pointermove", (e) => { dot.style.opacity = 1; qx(e.clientX); qy(e.clientY); });
    root.addEventListener("pointerleave", () => (dot.style.opacity = 0));
    document.addEventListener("pointerover", (e) => { const h = e.target.closest && e.target.closest("a, button"); dot.style.opacity = h ? .35 : 1; dot.style.width = dot.style.height = h ? "38px" : ""; });
    $$(".btn").forEach((el) => {
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .22, y: (e.clientY - r.top - r.height / 2) * .3, duration: .4, overwrite: "auto" }); });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.4)" }));
    });
  }

  /* dialog (collects nothing) */
  const dlg = $("#soon");
  $$("[data-soon]").forEach((b) => b.addEventListener("click", () => { if (!dlg.open) dlg.showModal(); if (can) gsap.from(".cm-dialog-in > *", { y: 18, opacity: 0, stagger: .08, duration: .6, ease: "power3.out", clearProps: "transform,opacity" }); }));
  $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  /* faq accordion: one open at a time, works with or without GSAP */
  const fqs = $$(".fq");
  function toggle(item, show) {
    const bt = $("button", item), pn = $(".fa", item);
    bt.setAttribute("aria-expanded", String(show)); pn.inert = !show;
    if (!can) { pn.style.height = show ? "auto" : "0"; return; }
    gsap.to(pn, { height: show ? "auto" : 0, duration: .55, ease: "power3.inOut", overwrite: true, onComplete: () => ScrollTrigger.refresh() });
  }
  fqs.forEach((q, i) => {
    const b = $("button", q), a = $(".fa", q);
    b.id = b.id || "fqb" + i; a.id = a.id || "fqa" + i;
    b.setAttribute("aria-controls", a.id); a.setAttribute("role", "region"); a.setAttribute("aria-labelledby", b.id);
    a.inert = true; if (!can) a.style.height = "0";
    b.addEventListener("click", () => {
      const willOpen = b.getAttribute("aria-expanded") !== "true";
      fqs.forEach((o) => { if (o !== q && $("button", o).getAttribute("aria-expanded") === "true") toggle(o, false); });
      toggle(q, willOpen);
    });
  });

  if (!can) return;

  /* split headings */
  const heads = $$("[data-split]").map((el) => ({ el, w: split(el) }));
  const why = $("#whyText"), whyW = split(why);

  /* ---------- hero: arch window opens to full bleed ---------- */
  let played = false;
  gsap.set(".hero-h1 i", { yPercent: 115 });
  const play = () => { if (played) return; played = true; gsap.to(".hero-h1 i", { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: .14 }); };
  gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#hero", start: "top top", end: "+=150%", pin: true, scrub: .6, anticipatePin: 1 } })
    .to(".hero-win", { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", duration: 1 }, 0)
    .fromTo(".hero-win img", { scale: 1.4 }, { scale: 1, duration: 1.2 }, 0)
    .to(".hero-h1", { color: "#efe9da", duration: .3 }, .25)
    .to(".hero-h1 .l:nth-child(odd) i", { x: -40, duration: 1 }, 0)
    .to(".hero-h1 .l:nth-child(even) i", { x: 40, duration: 1 }, 0)
    .to(".hero-sub", { opacity: 1, y: 0, duration: .4 }, .7)
    .to(".hero-hint", { opacity: 0, duration: .2 }, 0)
    .to({}, { duration: .3 });

  /* ---------- why: words light up ---------- */
  gsap.set(whyW, { opacity: .3 });
  gsap.to(whyW, { opacity: 1, stagger: .5, ease: "none", scrollTrigger: { trigger: why, start: "top 85%", end: "bottom 60%", scrub: true, invalidateOnRefresh: true } });

  /* ---------- pinned sections (desktop) + flow (mobile) ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    /* help: cards stack */
    const cards = $$(".hc"), tabs = $$(".help-tabs li");
    gsap.set(cards.slice(1), { yPercent: 110 }); gsap.set(tabs[0], { opacity: 1 });
    const h = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#help", start: "top top", end: "+=" + cards.length * 75 + "%", pin: true, scrub: .6, anticipatePin: 1 } });
    cards.forEach((c, i) => {
      if (!i) return;
      h.to(c, { yPercent: 0, duration: 1 }, i - 1)
       .to(cards[i - 1], { scale: .92, opacity: .45, duration: 1 }, i - 1)
       .to(tabs[i - 1], { opacity: .4, duration: .3 }, i - 1).to(tabs[i], { opacity: 1, duration: .3 }, i - 1 + .6);
    });
    h.to({}, { duration: .4 });

    /* places: horizontal scroll (one distance function keeps track, bar and pin length in sync) */
    const track = $(".pl-track"), dist = () => Math.max(1, track.scrollWidth - root.clientWidth);
    gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: "#places", start: "top top", end: () => "+=" + dist(), pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 } });
    gsap.to(".pl-bar i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#places", start: "top top", end: () => "+=" + dist(), scrub: true, invalidateOnRefresh: true } });
    gsap.fromTo(".pc-img", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power3.inOut", stagger: .12, scrollTrigger: { trigger: "#places", start: "top 60%" } });

    /* voices: quotes swap */
    const q = $$(".vq"), dots = $$(".v-dots i");
    gsap.set(q.slice(1), { opacity: 0 }); dots[0].classList.add("on");
    const setDot = (n) => dots.forEach((d, k) => d.classList.toggle("on", k === n));
    const v = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#voices", start: "top top", end: "+=" + q.length * 70 + "%", pin: true, scrub: .5, anticipatePin: 1 } });
    q.forEach((x, i) => {
      v.fromTo($("img", x), { scale: 1.15 }, { scale: 1, duration: 1 }, i);
      if (i) {
        /* old text clears out BEFORE the new slide fades in, so the two quotes never overlap */
        v.to([$("blockquote", q[i - 1]), $("figcaption", q[i - 1])], { opacity: 0, y: -24, duration: .25 }, i - .5);
        v.to(x, { opacity: 1, duration: .25 }, i - .25).from([$("blockquote", x), $("figcaption", x)], { y: 50, opacity: 0, duration: .3 }, i - .25);
        v.call(() => setDot(i - 1), null, i - .3).call(() => setDot(i), null, i - .1);
      }
    });
    v.to({}, { duration: .3 });

    /* how: images crossfade with steps */
    const im = $$(".how-imgs img"), st = $$(".hs");
    gsap.set(im.slice(1), { clipPath: "inset(100% 0% 0% 0%)" }); gsap.set(st.slice(1), { opacity: 0, y: 30 });
    const w = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#how", start: "top top", end: "+=220%", pin: true, scrub: .6, anticipatePin: 1 } });
    st.forEach((s, i) => {
      if (!i) return;
      w.to(st[i - 1], { opacity: 0, y: -30, duration: .4 }, i - .5).to(s, { opacity: 1, y: 0, duration: .4 }, i - .1)
       .to(im[i], { clipPath: "inset(0% 0% 0% 0%)", duration: .6 }, i - .5).to(".how-line i", { scaleX: (i + 1) / 3, duration: .6 }, i - .5);
    });
    w.to({}, { duration: .5 });
  });
  mm.add("(max-width: 900px)", () => {
    $$(".v-pin,.how-imgs,.how-steps").forEach((e) => e.classList.add("flow"));
    $$(".hc,.pc,.vq,.hs").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
    return () => $$(".v-pin,.how-imgs,.how-steps").forEach((e) => e.classList.remove("flow"));
  });

  /* ---------- passport ---------- */
  gsap.timeline({ scrollTrigger: { trigger: ".pass-stage", start: "top 70%" } })
    .from(".pass", { x: 160, rotate: 5, opacity: 0, duration: 1.3, ease: "power3.out" })
    .to(".pass-leaf .draw", { strokeDashoffset: 0, duration: 1.8, stagger: .1, ease: "power2.inOut" }, .5)
    .from(".pass-meta div", { opacity: 0, y: 14, stagger: .14, duration: .6 }, .8)
    .from(".stamp", { scale: 2.4, opacity: 0, rotate: -50, duration: .8, ease: "back.out(2)" }, 1.9);
  if (fine) {
    const c = $(".pass"), s = $(".pass-stage"), rx = gsap.quickTo(c, "rotationX", { duration: .5 }), ry = gsap.quickTo(c, "rotationY", { duration: .5 });
    s.addEventListener("pointermove", (e) => { const r = s.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 8); rx(-((e.clientY - r.top) / r.height - .5) * 8); });
    s.addEventListener("pointerleave", () => { rx(0); ry(0); });
  }

  /* ---------- faq, paths, closing ---------- */
  gsap.from(".fq", { opacity: 0, y: 24, stagger: .1, duration: .8, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".faq", start: "top 85%" } });
  gsap.from(".path", { opacity: 0, y: 40, stagger: .12, duration: .9, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".paths", start: "top 88%" } });
  gsap.fromTo(".close-bg img", { yPercent: -7, scale: 1.12 }, { yPercent: 7, scale: 1.02, ease: "none", scrollTrigger: { trigger: ".close", start: "top bottom", end: "bottom top", scrub: true } });

  /* heading word reveals, progress bar */
  heads.forEach(({ el, w }) => { gsap.set(w, { yPercent: 115 }); ScrollTrigger.create({ trigger: el, start: "top 86%", once: true, onEnter: () => gsap.to(w, { yPercent: 0, duration: 1, ease: "power4.out", stagger: .06 }) }); });
  gsap.to(".cm-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .2 } });

  /* loader, then hero lines (with a failsafe so a stalled timeline can never trap the page) */
  const l = $("#loader"), hideLoader = () => { l.style.display = "none"; };
  gsap.timeline().to($(".loader-mark", l), { scale: 1.08, duration: .6, ease: "power1.inOut" })
    .to(l, { opacity: 0, duration: .7, ease: "power2.inOut", onComplete: hideLoader }, "+=.05").add(play, "-=.45");
  setTimeout(() => { hideLoader(); play(); }, 5000);
  addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();