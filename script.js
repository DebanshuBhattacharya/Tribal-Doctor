/* ==========================================================================
   TRIBAL DOCTOR — SCRIPT
   Organized init functions, each responsible for one part of the experience.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Animate only when GSAP loaded and the visitor hasn't asked for reduced motion.
  // Otherwise drop the "js" flag so every pre-animation hidden state in the CSS switches off
  // and the page simply shows its content.
  const canAnimate =
    !!(window.gsap && window.ScrollTrigger) && !prefersReducedMotion;
  if (!canAnimate) root.classList.remove("js");
  if (canAnimate) gsap.registerPlugin(ScrollTrigger);

  /* ---------------- LOADER ----------------
     Fades out, and hands off to the hero reveal while it is still ~half faded,
     so the heading appears to arrive out of the loader instead of after a blank beat. */
  function initLoader(onReveal) {
    const loader = $("#loader");
    if (!loader) return onReveal();

    if (!canAnimate) {
      loader.style.display = "none";
      return onReveal();
    }

    const tl = gsap.timeline();
    tl.to($(".loader-mark", loader), {
      scale: 1.08,
      duration: 0.6,
      ease: "power1.inOut",
    })
      .to(
        loader,
        {
          opacity: 0,
          duration: 0.7,
          ease: "power2.inOut",
          onComplete: () => {
            loader.style.display = "none";
          },
        },
        "+=0.05",
      )
      .add(onReveal, "-=0.45");
  }

  /* ---------------- NAVBAR ---------------- */
  function initNavbar() {
    const navbar = $("#navbar");
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavbar = () => {
      const currentScrollY = window.scrollY;

      // At the very top — always show navbar
      if (currentScrollY <= 40) {
        navbar.classList.remove("nav-hidden");
        navbar.classList.remove("scrolled");

        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // Add scrolled state
      navbar.classList.add("scrolled");

      // Scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        navbar.classList.add("nav-hidden");
      }

      // Scrolling up
      else if (currentScrollY < lastScrollY) {
        navbar.classList.remove("nav-hidden");
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    updateNavbar();
  }

  /* ---------------- MOBILE MENU ---------------- */
  function initMobileMenu() {
    const btn = $("#hamburger");
    const menu = $("#mobileMenu");
    if (!btn || !menu) return;

    let open = false;
    const set = (next) => {
      open = next;
      menu.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    btn.addEventListener("click", () => set(!open));
    $$("a", menu).forEach((a) =>
      a.addEventListener("click", () => open && set(false)),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) set(false);
    });
    // if the window is widened past the mobile breakpoint while open, close it
    window.matchMedia("(min-width: 769px)").addEventListener("change", (e) => {
      if (e.matches && open) set(false);
    });
  }

  /* ---------------- HERO ANIMATIONS ----------------
     Sets every starting state immediately (while the loader still covers the page),
     builds the timeline paused, and returns a function that plays it. */
  function initHeroAnimations() {
    if (!canAnimate) return () => {};

    const inners = $$(".hero-heading .line-inner");
    const eyebrow = $(".hero-eyebrow");
    const sub = $(".hero-sub");
    const ctas = $(".hero-ctas");
    const stats = $(".hero-stats");
    const tunnelEl = $("#heroTunnel");

    // Each heading line's text sits below its clipping mask, then slides up into it.
    gsap.set(inners, { yPercent: 118 });
    gsap.set(eyebrow, { opacity: 0, y: 10 });
    gsap.set([sub, stats], { opacity: 0, y: 16 });
    gsap.set(ctas, { opacity: 0, y: 12 });
    gsap.set(tunnelEl, { opacity: 0 });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
    });
    tl.to(tunnelEl, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0.1)
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.7 }, 0.1)
      .to(
        inners,
        { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.12 },
        0.22,
      )
      .to(sub, { opacity: 1, y: 0, duration: 0.8 }, 0.75)
      .to(ctas, { opacity: 1, y: 0, duration: 0.7 }, 0.9)
      .to(stats, { opacity: 1, y: 0, duration: 0.7 }, 1.1);

    return () => tl.play();
  }

  /* ---------------- GENERIC SCROLL REVEALS ---------------- */
  function initScrollAnimations() {
    if (!canAnimate) return;

    // trust strip words
    gsap.set(".trust-track span", { y: 10 });
    gsap.to(".trust-track span", {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: ".trust-strip", start: "top 85%" },
    });
  }

  /* ---------------- MEDICINE × HERB CHECK ----------------
     The whole section is one pinned scene. Scrolling plays a four-step story on the phone
     (snap -> recognise -> herbs -> why) while the matching step opens on the left.
     Desktop pins the full scene; mobile pins just the steps + phone. Start states are set from
     here (never in CSS) and `is-live` is only added when this runs, so without GSAP, with
     reduced motion, or on short screens the section simply flows and every step stays readable.
     matchMedia reverts everything on breakpoint change. */
  function initScanxAnimation() {
    const root = $(".scx");
    if (!canAnimate || !root) return;
    try {
      const q = (s) => gsap.utils.toArray(s, root);
      const steps = q(".scx-step");
      const floats = q(".scx-float");
      const [s1, s2, s3, s4] = q(".scx-screen");
      const mm = gsap.matchMedia();

      const setStep = (k) => {
        steps.forEach((s, i) => {
          s.classList.toggle("is-active", i === k);
          s.classList.toggle("is-done", i < k);
        });
        floats.forEach((f) =>
          f.classList.toggle("is-on", Number(f.dataset.step) === k),
        );
      };
      const stepAt = (p) => (p < 0.27 ? 0 : p < 0.54 ? 1 : p < 0.8 ? 2 : 3);

      const build = (pinTarget, screens) => {
        root.classList.add("is-live");
        let last = -1;

        // ---- start states ----
        gsap.set([s2, s3], { autoAlpha: 0 });
        gsap.set(s4, { autoAlpha: 0, yPercent: 100 });
        gsap.set(".scx-corner", { scale: 1.3, autoAlpha: 0.4 });
        gsap.set(".scx-sweep", { autoAlpha: 0, top: "6%" });
        gsap.set(".scx-detect", { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(".scx-tag", { autoAlpha: 0, y: 6 });
        const s2items = q(
          ".scx-appbar, .scx-med, .scx-medsub, .scx-facts > div, .scx-checking-label, .scx-bar",
        ).filter((el) => s2.contains(el));
        gsap.set(s2items, { autoAlpha: 0, y: 14 });
        gsap.set(".scx-bar i", { scaleX: 0 });
        gsap.set(".scx-found", { autoAlpha: 0, y: 10 });
        gsap.set(".scx-s3 .scx-appbar, .scx-herb", { autoAlpha: 0, y: 18 });
        gsap.set(".scx-herb .scx-chip", {
          scale: 0.6,
          transformOrigin: "left center",
        });
        gsap.set(".scx-hero img", { scale: 1.22 });
        gsap.set(".scx-detail > *", { autoAlpha: 0, y: 12 });
        gsap.set(".scx-cta", { autoAlpha: 0, y: 12 });
        gsap.set(".scx-glow", { opacity: 0.6 });
        setStep(0);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pinTarget,
            start: "top top",
            end: () => "+=" + Math.round(window.innerHeight * screens),
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: -1, // refresh after the pins above it on the page
            onUpdate: (self) => {
              const k = stepAt(self.progress);
              if (k !== last) {
                last = k;
                setStep(k);
              }
            },
          },
        });
        tl.to({}, { duration: 1 }, 0) // spans the whole pin
          .fromTo(
            ".scx-rail-fill",
            { scaleY: 0 },
            { scaleY: 1, duration: 1, immediateRender: true },
            0,
          )
          .to(".scx-glow", { opacity: 1, duration: 1 }, 0)
          .fromTo(
            ".scx-phone",
            { rotation: -1.4 },
            { rotation: 1.4, duration: 1 },
            0,
          )
          .to(".scx-hint", { autoAlpha: 0, duration: 0.04 }, 0.03)
          // 1. camera: frame locks on, one scan pass, the label is detected
          .to(
            ".scx-corner",
            {
              scale: 1,
              autoAlpha: 1,
              duration: 0.08,
              stagger: 0.01,
              ease: "power2.out",
            },
            0.01,
          )
          .to(".scx-sweep", { autoAlpha: 1, duration: 0.02 }, 0.05)
          .to(".scx-sweep", { top: "92%", duration: 0.12 }, 0.05)
          .to(".scx-sweep", { autoAlpha: 0, duration: 0.02 }, 0.17)
          .to(
            ".scx-detect",
            { strokeDashoffset: 0, duration: 0.06, ease: "power1.inOut" },
            0.15,
          )
          .to(
            ".scx-tag",
            { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" },
            0.2,
          )
          .to(".scx-shutter i", { scale: 0.8, duration: 0.015 }, 0.235)
          .to(".scx-shutter i", { scale: 1, duration: 0.015 }, 0.25)
          // 2. photo -> recognised medicine
          .to(s1, { autoAlpha: 0, scale: 1.06, duration: 0.04 }, 0.26)
          .to(s2, { autoAlpha: 1, duration: 0.04 }, 0.26)
          .to(
            s2items,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.05,
              stagger: 0.012,
              ease: "power2.out",
            },
            0.3,
          )
          .to(
            ".scx-bar i",
            { scaleX: 1, duration: 0.1, ease: "power1.inOut" },
            0.4,
          )
          .to(
            ".scx-found",
            { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" },
            0.49,
          )
          // 3. the herb shortlist
          .to(s2, { autoAlpha: 0, y: -12, duration: 0.04 }, 0.53)
          .to(s3, { autoAlpha: 1, duration: 0.04 }, 0.53)
          .to(
            ".scx-s3 .scx-appbar, .scx-herb",
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.05,
              stagger: 0.03,
              ease: "power2.out",
            },
            0.57,
          )
          .to(
            ".scx-herb .scx-chip",
            { scale: 1, duration: 0.04, stagger: 0.03, ease: "back.out(2)" },
            0.63,
          )
          // 4. the "why": a detail sheet slides up over the list
          .to(s3, { scale: 0.94, duration: 0.06 }, 0.78)
          .to(s4, { autoAlpha: 1, duration: 0.01 }, 0.78)
          .to(s4, { yPercent: 0, duration: 0.06, ease: "power3.out" }, 0.78)
          .to(
            ".scx-hero img",
            { scale: 1, duration: 0.12, ease: "power2.out" },
            0.8,
          )
          .to(
            ".scx-detail > *",
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.04,
              stagger: 0.03,
              ease: "power2.out",
            },
            0.84,
          )
          // call to action
          .to(
            ".scx-cta",
            { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" },
            0.88,
          );

        return () => root.classList.remove("is-live", "is-reset");
      };

      mm.add("(min-width: 901px)", () => build(".scx-pin", 3.2));

      mm.add("(max-width: 900px)", () => build(".scx-stage", 2.8));
    } catch (err) {
      console.warn("Medicine check animation skipped:", err);
      root.classList.remove("is-live");
    }
  }

  /* ---------------- SUSTAINABILITY ---------------- */
  function initSustainabilityAnimation() {
    return; // handled by premium.js
    if (!canAnimate || !$(".sustainability")) return;

    const trigger = {
      trigger: ".sustainability",
      start: "top 60%",
      once: true,
    };
    gsap.fromTo(
      ".sus-media",
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.3,
        ease: "power3.inOut",
        scrollTrigger: trigger,
      },
    );
    gsap.fromTo(
      ".sus-media img",
      { scale: 1.15 },
      { scale: 1, duration: 1.8, ease: "power2.out", scrollTrigger: trigger },
    );
    gsap.fromTo(
      ".sus-item",
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { ...trigger, start: "top 50%" },
      },
    );
  }

  /* ---------------- FINAL CTA (closing editorial page) ----------------
     Rules draw in, the headline rises line by line, the plate is drawn, then the copy and button
     arrive. Start states are set here (never in CSS) so the section is fully visible if GSAP fails;
     reduced-motion visitors never reach this code. */
  function initFinalCtaAnimation() {
    const root = $(".final-cta");
    if (!canAnimate || !root) return;
    try {
      const q = (s) => gsap.utils.toArray(s, root);
      const lines = q(".fin-line-in");
      const rules = q(".fin-rule");
      const meta = q(".fin-eyebrow, .fin-meta-r");
      const strokes = q(".fin-plant path, .fin-plant circle");
      const cap = q(".fin-cap");
      const copy = q(".fin-copy p, .fin-copy .btn");
      const closing = q(".fin-sign");

      gsap.set(lines, { yPercent: 115 });
      gsap.set(rules, { scaleX: 0 });
      gsap.set(meta, { autoAlpha: 0, y: 8 });
      gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(cap, { autoAlpha: 0 });
      gsap.set(copy, { autoAlpha: 0, y: 16 });
      gsap.set(closing, { autoAlpha: 0 });

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root, start: "top 62%", once: true },
        })
        .to(
          rules,
          { scaleX: 1, duration: 1.4, ease: "power2.inOut", stagger: 0.25 },
          0,
        )
        .to(
          meta,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            clearProps: "transform",
          },
          0.1,
        )
        .to(
          lines,
          { yPercent: 0, duration: 1.2, stagger: 0.17, ease: "power4.out" },
          0.25,
        )
        .to(
          strokes,
          {
            strokeDashoffset: 0,
            duration: 2,
            stagger: 0.04,
            ease: "power2.inOut",
          },
          0.7,
        )
        .to(cap, { autoAlpha: 1, duration: 0.8 }, 2.1)
        .to(
          copy,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.14,
            clearProps: "transform",
          },
          1.2,
        )
        .to(closing, { autoAlpha: 1, duration: 0.9 }, 1.7);
    } catch (err) {
      console.warn("Final CTA animation skipped:", err);
      gsap.set(root.querySelectorAll("*"), { clearProps: "all" });
    }
  }

  /* ---------------- KNOWLEDGE PASSPORT ---------------- */
  function initPassportTimeline() {
    if (!canAnimate) return;
    const list = $("#ppSteps");
    if (!list) return;
    const steps = gsap.utils.toArray(".pp-step", list);
    const ticks = gsap.utils.toArray(".pp-tick");
    const count = $("#ppCount");
    const name = $("#ppName");
    const lineFill = $("#ppLineFill");

    function setActive(i) {
      steps.forEach((s, n) => {
        s.classList.toggle("is-active", n === i);
        s.classList.toggle("is-done", n < i);
      });
      ticks.forEach((t, n) => t.classList.toggle("is-on", n <= i));
      if (count) count.textContent = String(i + 1).padStart(2, "0");
      if (name) name.textContent = steps[i].dataset.label || "";
    }

    steps.forEach((s, i) => {
      gsap.fromTo(
        s,
        { y: 24 },
        {
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: { trigger: s, start: "top 90%", once: true },
        },
      );
      ScrollTrigger.create({
        trigger: s,
        start: "top 58%",
        end: "bottom 58%",
        onToggle: (self) => {
          if (self.isActive) setActive(i);
        },
      });
    });

    if (lineFill) {
      gsap.to(lineFill, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: list,
          start: "top 58%",
          end: "bottom 58%",
          scrub: true,
        },
      });
    }

    gsap.fromTo(
      "#ppDoc",
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: { trigger: "#ppDoc", start: "top 85%", once: true },
      },
    );
  }

  /* ---------------- PRODUCT CARD INTERACTIONS ---------------- */
  function initProductInteractions() {
    // handled primarily via CSS hover states; JS reserved for future
    // richer interactions (quick-view, wishlist, etc.) on later pages.
  }

  /* ---------------- COUNTERS (generic, reusable) ---------------- */
  function initCounters() {
    // This function stays as the general hook for future numeric counters
    // (e.g. stats on About / Communities pages). The plant-identify section
    // has its own real (non-demo) logic further down this file.
  }

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function initMagneticButtons() {
    return; // magnetic buttons disabled
    if (!canAnimate || window.matchMedia("(pointer: coarse)").matches) return;

    $$("[data-magnetic]").forEach((el) => {
      let bounds;
      const strength = 0.28;

      const onEnter = () => (bounds = el.getBoundingClientRect());
      const onMove = (e) => {
        if (!bounds) bounds = el.getBoundingClientRect();
        const relX = e.clientX - (bounds.left + bounds.width / 2);
        const relY = e.clientY - (bounds.top + bounds.height / 2);
        gsap.to(el, {
          x: relX * strength,
          y: relY * strength,
          duration: 0.4,
          ease: "power2.out",
        });
      };
      const onLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
    });
  }

  /* ---------------- CURSOR FOLLOW (desktop only, tasteful) ---------------- */
  function initCursor() {
    if (!canAnimate || window.matchMedia("(pointer: coarse)").matches) return;
    const dot = $("#cursorDot");
    if (!dot) return;

    window.addEventListener("mousemove", (e) => {
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    });

    $$("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () =>
        gsap.to(dot, { scale: 2.4, duration: 0.25 }),
      );
      el.addEventListener("mouseleave", () =>
        gsap.to(dot, { scale: 1, duration: 0.25 }),
      );
    });
  }

  /* ---------------- INIT ALL ---------------- */
  function bootstrap() {
    initNavbar();
    initMobileMenu();

    const playHero = initHeroAnimations();
    initScrollAnimations();
    initPassportTimeline();
    initProductInteractions();
    initSustainabilityAnimation();
    initScanxAnimation();
    initFinalCtaAnimation();
    initCounters();
    initMagneticButtons();
    initCursor();

    return playHero;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const playHero = bootstrap();

    // Wait for the web fonts (max 1.5s) before revealing the hero. Otherwise the heading is
    // set in a fallback font, then re-flows mid-animation when the real font arrives.
    const fontsReady =
      document.fonts && document.fonts.ready
        ? Promise.race([
            document.fonts.ready,
            new Promise((r) => setTimeout(r, 1500)),
          ])
        : Promise.resolve();

    fontsReady.then(() => {
      if (canAnimate) ScrollTrigger.refresh();
      initLoader(playHero);
    });

    // images change section heights; recalculate trigger positions once everything has loaded
    window.addEventListener("load", () => {
      if (canAnimate) ScrollTrigger.refresh();
    });
  });
})();
/* ==========================================================================
   TRIBAL DOCTOR — PREMIUM MOTION (v3)
   Loaded after script.js.
   - Slow, readable pacing: sections hold on screen while their content reveals
   - Sticky story with chapter-by-chapter photo wipes
   - Layered hero parallax, fireflies, scroll progress
   Skipped entirely for reduced-motion visitors.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- reading progress hairline ---- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  const updateBar = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
  };
  window.addEventListener("scroll", updateBar, { passive: true });
  window.addEventListener("resize", updateBar);
  updateBar();

  /* ---- eyebrow rules draw in ---- */
  const eyebrows = $$(".eyebrow");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.6 },
    );
    eyebrows.forEach((el) => io.observe(el));
  } else eyebrows.forEach((el) => el.classList.add("is-in"));

  /* ---- hero photos: if one fails to load, hide the broken-image icon and alt text ---- */
  const heroImgs = $$("#heroVisualMain img, #heroVisualSecondary img");
  const checkImgs = () =>
    heroImgs.forEach((im) => {
      if (im.complete && im.naturalWidth === 0) im.style.visibility = "hidden";
    });
  heroImgs.forEach((im) => im.addEventListener("error", checkImgs));
  checkImgs();
  window.addEventListener("load", () => setTimeout(checkImgs, 50));

  /* ---- hero: perspective tunnel (cards fly toward the camera as you scroll) ---- */
  function initTunnel() {
    const root = $("#heroTunnel");
    const plane = $("#tunnelPlane");
    const cue = $("#tunnelCue");
    const head = $(".hero-heading");
    const supports = $$(".hero-pre, .hero-extras");
    if (!root || !plane) return null;

    // piecewise-linear lookup, like framer-motion's useTransform(value, xs, ys)
    const keys = (v, xs, ys) => {
      if (v <= xs[0]) return ys[0];
      for (let k = 1; k < xs.length; k++) {
        if (v <= xs[k])
          return (
            ys[k - 1] +
            ((v - xs[k - 1]) / (xs[k] - xs[k - 1])) * (ys[k] - ys[k - 1])
          );
      }
      return ys[ys.length - 1];
    };

    const DATA = [
      [
        "https://images.openai.com/static-rsc-4/n2G28nW2dmiFcuFpgfVZN46vqvwg97mHPOJ2BqOThsJof8e78pYsux510ribE_MzNY2E7Cq7riDWUfzM3y-TjQ3kIjTYa5CmDH0rWfnMED0QC5K1ML5rsVyVAwhX9PhbPrHo12ZOhsGcM9Ff6AOz0Yf1-pvw-G0Qo71cnTjmYpw?purpose=inline",
        "Lemongrass",
      ],
      [
        "https://images.openai.com/static-rsc-4/YYHd5J7ip4TPUAOnpX5bk14QdcSu6U9nDzqmOK5Dp67moT8UjZBq0epOzR3u65jUHnnYTsPE__Ghve-2d7ODY9yKob9PikZgiVJC1gE2Wc2VNH95B55cgHSrwp902KfrzHHDD5N8o1bkxE7w5ITIRPSefUVPUPCUIWx7l1EGzySDqGDH7J3wHs9MFfjn9ClI?purpose=fullsize",
        "Ashwagandha",
      ],
      [
        "https://images.openai.com/static-rsc-4/8rq6l8Uz-LQbVsq3HJRCfoc750z6VZctD7H3gIpa6u0cfPms4QDlQr3_vszBRuslceDeOW1kSLytx47opUzNJdMUy-JLUGCkL1isrJcCsfO8PZEY1Kgpf_aDYfpGYYMZJ-Cxp4c6RJX5jCHU6drbPmDdIF0WwSajSpYQM68Gl_BvDYl8j88P26B1xXPId5G3?purpose=fullsize",
        "Shatavari",
      ],
      [
        "https://images.openai.com/static-rsc-4/7Njmer-qgbehj-JHpKmtb3AcaRGF4rfUJEbt9btNYGPyvlbqeWx8FfK14gLJmMbdrWSn1094C8aizLxUCt40w-r0JSIMCtC4HQF8EEJOVmPPBjgqJaSiCNGvVhwSz5HHHkJKsNIXS63jQKg5EgwLOmX5jN4VsKLJh78I61WCUP8?purpose=inline",
        "Sarpagandha",
      ],
      [
        "https://images.openai.com/static-rsc-4/j5UHknmKJPkD_NV4AwLfn1IfU6P6TmNONum2q277H42taCjnvZxugJBgE1_fxqobXvMLXSkKvS8nmtRahWlLquoVAN7OMiA5ZLtrqSdgK7GWm1SLwon6DzQegCdcBVsQvJck_kTB1Pz6rcEN7IYH03gh05A817OrDv1ycL0Eyro?purpose=inline",
        "Bhringraj",
      ],
      [
        "https://images.openai.com/static-rsc-4/xGIgIKU8SZSJiFpRvbR-bHyozKYQSjIm3gdvMP2a6jwY6j-74SBvbe7risoO3W-pKh0zvE4vW35GMRogAN7J0GwbXamO1Rl_2HRDnjujjv1dT44hc1jHc9-peGQDSnR5zJRx_VUl3mSrcXpqyDZJjpRvu11jtCbE4ZxKOe6nggs?purpose=inline",
        "Arjun",
      ],
      [
        "https://images.openai.com/static-rsc-4/LkRFCatm7pGn8FwtlsJYZCG0kI0Tx0-ndLxm6EMTtk-AWbjKlAETwTZJh063x9mA7pJblHm8OHb05R4xOJ6Risdfp4Q2h7pDWGX-mZofZxITovL5Ex9s-2QYeoqk6Wz74YE9VsnMaCubMv3ILR_nvJZfb2TKTXItDD4Ue6jMUYM?purpose=inline",
        "Aloevera",
      ],
      [
        "https://images.openai.com/static-rsc-4/DX39gjFsR6zB-IfqRdWWNR_dgGQv6dY5WdS4RG84RiEI6wtkry5ZkUFZ9qDUfy-F0yzfuj02a_qangIT1OqM_V3dx8wCjE6A8a4wVsDraZoqCJlGV1lo88A9Knt75tHg6E8QQ7bpmAN0YRV3OHFvFSDukxcKdJmMKOto3rKO_QuIYkQvQuILIoyvb4o-mVDp?purpose=inline",
        "Palash",
      ],
      [
        "https://images.openai.com/static-rsc-4/xlrWx7dTICCHcDMDPmdoexYVdhG2wIgRMNVSP1utIx-5vDLqqf0thp1Z1cEKe8pJrcYT_Fwm6JxkBumZJXQ3qM9Fp0G_4rqfjy9ieFG-L1o5csCcQkquO1E7hHAxTSfUE_HZ8GTNEmY_QWE_3480KbgUYyRcIqXT5wZLW6Mch6dUZl5kGt5Fxl-gcPQeru5Q?purpose=fullsize",
        "Betel leaf",
      ],
    ];
    const N = DATA.length,
      SPAN = 0.55;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    const cards = DATA.map(([src, title], i) => {
      const ang = i * 137.5 * (Math.PI / 180);
      const el = document.createElement("figure");
      el.className = "tunnel-card";
      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      img.draggable = false;
      img.loading = "lazy";
      img.addEventListener("error", () => el.classList.add("no-img"));
      const cap = document.createElement("figcaption");
      cap.textContent = title;
      el.append(img, cap);
      el.style.zIndex = i + 1;
      plane.appendChild(el);
      return {
        el,
        cos: Math.cos(ang),
        sin: Math.sin(ang),
        rx: 0.28 + (i % 3) * 0.08,
        ry: 0.26 + (i % 2) * 0.09,
        rot: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
        start: (i / N) * (1 - SPAN),
      };
    });

    const S = { w: 1, h: 1, mobile: false };
    const target = { p: 0, x: 0, y: 0 };
    const cur = { p: -1, x: 0, y: 0 };
    let active = false,
      raf = 0;

    function measure() {
      S.w = root.clientWidth || 1;
      S.h = root.clientHeight || 1;
      S.mobile = window.innerWidth < 768;
      const cw = S.mobile
        ? clamp(S.w * 0.38, 130, 180)
        : clamp(S.w * 0.2, 180, 270);
      root.style.setProperty("--cw", cw + "px");
      root.style.setProperty("--persp", (S.mobile ? 900 : 1200) + "px");
      cur.p = -1;
      render();
    }

    function render() {
      // headline: bold and compact at rest, then grows and fades as the photos come forward.
      // Supporting copy + buttons fade away sooner so they never sit under the photos.
      const sp = clamp(cur.p, 0, 1);
      if (head && !reduce) {
        head.style.transform = `scale(${keys(sp, [0, 0.65, 1], [1, 1.9, 2.4]).toFixed(3)})`;
        head.style.opacity = keys(sp, [0, 0.08, 0.6, 1], [1, 1, 0, 0]).toFixed(
          3,
        );
      }
      const so = reduce ? 1 : keys(sp, [0, 0.04, 0.2], [1, 1, 0]);
      supports.forEach((el) => {
        el.style.opacity = so.toFixed(3);
        el.style.pointerEvents = so > 0.5 ? "auto" : "none";
      });
      const farZ = S.mobile ? -1200 : -1700,
        nearZ = S.mobile ? 350 : 500;
      const pan = S.mobile ? 20 : 45;
      for (const c of cards) {
        const loc = clamp((cur.p - c.start) / SPAN, 0, 1);
        const z = farZ + (nearZ - farZ) * loc;
        let o;
        if (loc <= 0) o = 0;
        else if (loc < 0.18) o = loc / 0.18;
        else if (loc <= 0.82) o = 1;
        else if (loc < 0.98) o = (0.98 - loc) / 0.16;
        else o = 0;
        const x = c.cos * S.w * c.rx - cur.x * pan;
        const y = c.sin * S.h * c.ry - cur.y * pan;
        c.el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px) rotateZ(${c.rot}deg)`;
        c.el.style.opacity = o.toFixed(3);
      }
    }

    function tick() {
      raf = 0;
      const dp = target.p - cur.p,
        dx = target.x - cur.x,
        dy = target.y - cur.y;
      if (Math.abs(dp) > 1e-4 || Math.abs(dx) > 1e-3 || Math.abs(dy) > 1e-3) {
        cur.p += dp * 0.12;
        cur.x += dx * 0.06;
        cur.y += dy * 0.06;
        render();
      }
      if (active) raf = requestAnimationFrame(tick);
    }
    function setActive(v) {
      active = v;
      if (v && !raf) raf = requestAnimationFrame(tick);
    }

    // scroll progress 0..1 -> tunnel progress (starts partway in so cards are visible immediately)
    function setProgress(sp) {
      target.p = sp;
      if (cue) cue.style.opacity = clamp(1 - sp * 6, 0, 1);
      if (!raf && active) raf = requestAnimationFrame(tick);
    }

    if (!reduce) {
      window.addEventListener(
        "pointermove",
        (e) => {
          target.x = (e.clientX / window.innerWidth - 0.5) * 2;
          target.y = (e.clientY / window.innerHeight - 0.5) * 2;
        },
        { passive: true },
      );
    }
    new IntersectionObserver((es) => setActive(es[0].isIntersecting)).observe(
      root,
    );
    window.addEventListener("resize", measure);
    measure();
    if (reduce) {
      target.p = cur.p = 0.5;
      render();
    }
    return { setProgress };
  }
  const tunnel = initTunnel();

  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  const splitWords = (el) => {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    el.textContent = "";
    return text.split(" ").map((w, i, a) => {
      const s = document.createElement("span");
      s.className = "w";
      s.setAttribute("aria-hidden", "true");
      s.textContent = w;
      el.appendChild(s);
      if (i < a.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    const wide = window.innerWidth >= 1025 && window.innerHeight >= 700;
    const scrub = 1.1;

    /* =========================== HERO =========================== */
    const hero = $(".hero");
    if (hero && tunnel) {
      // The hero pins for a while; scrolling flies the camera through the tunnel.
      // (No wheel hijacking, so normal page scrolling keeps working.)
      const pinLen = wide ? "+=150%" : "+=110%";
      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: pinLen,
        pin: true,
        anticipatePin: 1,
        refreshPriority: 1,
        onUpdate: (self) => {
          tunnel.setProgress(self.progress);
        },
      });
    }

    /* =========================== STORY (horizontal editorial canvas) =========================== */
    (() => {
      const root = $("#story");
      const pin = root && $(".story-pin", root);
      const track = pin && $(".story-track", pin);
      if (!track) return;
      const chapters = $$(".story-chapter", track),
        fill = $(".story-progress-fill", root),
        labels = $$(".story-progress b", root);
      $$(".story-title", root).forEach((el) => {
        // masked word spans for the heading reveals
        if (el.dataset.split) return;
        el.dataset.split = "1";
        el.innerHTML = el.textContent
          .trim()
          .split(/\s+/)
          .map((w) => `<span class="story-word"><span>${w}</span></span>`)
          .join(" ");
      });

      if (window.__storyMM) window.__storyMM.revert(); // re-init safe
      const mm = (window.__storyMM = gsap.matchMedia());

      mm.add(
        "(min-width: 769px) and (prefers-reduced-motion: no-preference)",
        () => {
          root.classList.add("is-pinned");
          const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
          const run = () => dist() * 1.1; // scroll distance of the horizontal travel
          const hold = () => window.innerHeight * 0.9; // extra pinned scroll so the last chapter can be appreciated

          ScrollTrigger.create({
            trigger: pin,
            start: "top top",
            end: () => "+=" + (run() + hold()),
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });

          let cur = -1;
          const h = gsap.to(track, {
            x: () => -dist(),
            ease: "none",
            scrollTrigger: {
              trigger: pin,
              start: "top top",
              end: () => "+=" + run(),
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                fill.style.transform = `scaleX(${self.progress})`;
                const center =
                  -gsap.getProperty(track, "x") + window.innerWidth * 0.5;
                let k = 0;
                chapters.forEach((ch, i) => {
                  if (ch.offsetLeft <= center) k = i;
                });
                if (k !== cur) {
                  cur = k;
                  labels.forEach((l, i) =>
                    l.classList.toggle("on", i <= k - 1),
                  );
                } // c0 is the intro panel
              },
            },
          });

          chapters.forEach((ch, i) => {
            const win = {
              trigger: ch,
              containerAnimation: h,
              start: "left right",
              end: "right left",
              scrub: true,
              invalidateOnRefresh: true,
            };
            // different parallax speeds: photos drift slower than the canvas, type and annotations faster
            $$("[data-depth]", ch).forEach((el) => {
              const d = parseFloat(el.dataset.depth);
              gsap.fromTo(
                el,
                { x: () => d * window.innerWidth },
                {
                  x: () => -d * window.innerWidth,
                  ease: "none",
                  scrollTrigger: win,
                },
              );
            });
            // entrance: mask wipe, settle, labels, headline words, notes, leader lines
            const st =
              i === 0
                ? {
                    trigger: pin,
                    start: "top 60%",
                    toggleActions: "play none none reverse",
                  }
                : {
                    trigger: ch,
                    containerAnimation: h,
                    start: "left 72%",
                    toggleActions: "play none none reverse",
                  };
            gsap
              .timeline({ scrollTrigger: st })
              .fromTo(
                $$(".story-mask", ch),
                { clipPath: "inset(0% 0% 100% 0%)" },
                {
                  clipPath: "inset(0% 0% 0% 0%)",
                  duration: 1.3,
                  ease: "power3.inOut",
                  stagger: 0.3,
                },
                0,
              )
              .fromTo(
                $$(".story-mask img", ch),
                { scale: 1.08 },
                { scale: 1, duration: 1.6, ease: "power2.out", stagger: 0.3 },
                0,
              )
              .fromTo(
                $$(".story-tag, .eyebrow", ch),
                { autoAlpha: 0, x: -16 },
                { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.1 },
                0.2,
              )
              .fromTo(
                $$(".story-word > span", ch),
                { yPercent: 115 },
                {
                  yPercent: 0,
                  duration: 0.9,
                  stagger: 0.06,
                  ease: "power3.out",
                },
                0.35,
              )
              .fromTo(
                $$(".story-desc, .story-intro, .story-closing, .btn", ch),
                { autoAlpha: 0, y: 14 },
                { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14 },
                0.75,
              )
              .fromTo(
                $$(".story-note", ch),
                { autoAlpha: 0, y: 10 },
                { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14 },
                0.95,
              )
              .fromTo(
                $$(".story-line path", ch),
                { strokeDashoffset: 1 },
                {
                  strokeDashoffset: 0,
                  duration: 1.1,
                  ease: "power2.inOut",
                  stagger: 0.25,
                },
                1.1,
              )
              .fromTo(
                $$(".story-line circle", ch),
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.4, stagger: 0.25 },
                1.5,
              );
          });
          return () => root.classList.remove("is-pinned");
        },
      );
    })();

    /* ================== SLOW-PACED SECTIONS ================== */
    // Wrap a section's content in a sticky 100vh stage and lengthen the section,
    // then reveal the content in order while the visitor scrolls through it.
    const dwell = (sel, extraVh, build, onUpdate) => {
      const sec = $(sel);
      if (!sec) return;
      const wrap = document.createElement("div");
      wrap.className = "dwell";
      while (sec.firstChild) wrap.appendChild(sec.firstChild);
      sec.appendChild(wrap);
      sec.classList.add("is-dwell");
      sec.style.height = `calc(var(--vh) + ${extraVh}vh)`;
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: sec,
          start: "top 65%",
          end: "bottom bottom",
          scrub: 0.7,
          onUpdate: onUpdate ? (self) => onUpdate(self.progress) : undefined,
        },
      });
      tl.to({}, { duration: 1 }, 0); // timeline always spans the full scroll
      build(tl);
    };
    const drift = (tl, sel) =>
      tl.fromTo(
        sel,
        { yPercent: -8 },
        { yPercent: 8, ease: "none", duration: 1 },
        0,
      );

    if (wide) {
      dwell(".why", 150, (tl) => {
        const words = splitWords($(".why-statement"));
        gsap.set(words, { opacity: 0.14 });
        tl.fromTo(
          ".why-media",
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.2,
            ease: "power3.inOut",
          },
          0,
        );
        tl.fromTo(
          words,
          { opacity: 0.14 },
          { opacity: 1, stagger: 0.025, duration: 0.06, ease: "none" },
          0.12,
        );
        tl.to(
          ".why-line path",
          { strokeDashoffset: 0, duration: 0.1, ease: "none" },
          0.56,
        );
        tl.fromTo(
          ".why-text",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.16, duration: 0.14 },
          0.66,
        );
      });

      dwell(".sustainability", 90, (tl) => {
        tl.fromTo(
          ".sus-media",
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.3,
            ease: "power3.inOut",
          },
          0,
        );
        drift(tl, ".sus-media img");
        tl.fromTo(
          ".sus-copy > h2, .sus-copy > .sus-lead",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.14 },
          0.08,
        );
        tl.fromTo(
          ".sus-item",
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.14,
            clearProps: "transform",
          },
          0.3,
        );
      });
    } else {
      // small screens: plain flow, everything simply visible
      gsap.set(".why-text", { opacity: 1, y: 0 });
      gsap.set(".why-line path", { strokeDashoffset: 0 });
      gsap.set(".why-media", { clipPath: "none" });
    }

    /* ================== COMMUNITY (editorial collage reveal, no pinning) ==================
       Start states are set here, not in CSS, so the section stays visible if GSAP fails.
       Reduced-motion visitors never reach this code. */
    const community = $(".community");
    if (community) {
      try {
        const st = { trigger: community, start: "top 70%", once: true };
        // each frame wipes in from a different edge, staggered
        const wipes = [
          [".cc-a", "inset(0% 0% 100% 0%)", 0],
          [".cc-b", "inset(100% 0% 0% 0%)", 0.25],
          [".cc-c", "inset(0% 100% 0% 0%)", 0.45],
        ];
        wipes.forEach(([sel, from, delay]) => {
          gsap.fromTo(
            sel,
            { clipPath: from },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.2,
              delay,
              ease: "power3.inOut",
              clearProps: "clipPath",
              scrollTrigger: st,
            },
          );
          gsap.fromTo(
            sel + " img",
            { scale: 1.12 },
            {
              scale: 1,
              duration: 1.8,
              delay,
              ease: "power2.out",
              scrollTrigger: st,
            },
          );
        });
        gsap.fromTo(
          ".community-line-in",
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1,
            stagger: 0.12,
            delay: 0.15,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: st,
          },
        );
        gsap.fromTo(
          ".community-eyebrow, .community-text, .community-link, .community-credit",
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            delay: 0.45,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: st,
          },
        );
        // images drift inside their frames (frames stay put, so gaps never change); desktop only
        if (wide) {
          const drift = {
            trigger: community,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          };
          gsap.fromTo(
            ".cc-a img",
            { yPercent: -4 },
            { yPercent: 4, ease: "none", scrollTrigger: drift },
          );
          gsap.fromTo(
            ".cc-b img",
            { yPercent: 4 },
            { yPercent: -4, ease: "none", scrollTrigger: drift },
          );
          gsap.fromTo(
            ".cc-c img",
            { yPercent: -3 },
            { yPercent: 3, ease: "none", scrollTrigger: drift },
          );
        }
      } catch (err) {
        console.warn("Community reveal skipped:", err);
      }
    }

    /* ================== MARKETPLACE PREVIEW ("Forest to community") ==================
       Plain scroll reveals, no pinning. Hidden start states are set from here (not in CSS), so the
       section stays fully visible if GSAP fails; reduced-motion visitors never reach this code. */
    const mp = $(".mp");
    if (mp) {
      try {
        const once = (trigger, start) => ({ trigger, start, once: true });
        const rise = (targets, vars, st) =>
          gsap.fromTo(
            targets,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              clearProps: "transform,opacity",
              ...vars,
              scrollTrigger: st,
            },
          );

        rise(".mp-eyebrow, .mp-title", { stagger: 0.12 }, once(mp, "top 72%"));
        rise(".mp-lead", { delay: 0.3 }, once(mp, "top 72%"));

        // cards + photos: set the start state now, then reveal in batches as they scroll into view
        const cards = $$(".mp-card", mp);
        const photos = cards.map((c) => $("img", c));
        gsap.set(cards, { y: 70, opacity: 0 });
        gsap.set(photos, { scale: 1.18 });
        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: "power3.out",
              stagger: 0.14,
              clearProps: "transform,opacity",
            });
            gsap.to(
              batch.map((c) => $("img", c)),
              {
                scale: 1,
                duration: 1.8,
                ease: "power2.out",
                stagger: 0.14,
                clearProps: "transform",
              },
            );
          },
        });

        rise(".mp-cta", {}, once(".mp-cta", "top 90%"));

        // the botanical motif drifts slowly against the scroll
        gsap.to(".mp-deco", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: {
            trigger: mp,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      } catch (err) {
        console.warn("Marketplace preview animation skipped:", err);
        gsap.set(
          [
            ".mp-card",
            ".mp-card img",
            ".mp-eyebrow",
            ".mp-title",
            ".mp-lead",
            ".mp-cta",
          ],
          { clearProps: "all" },
        );
      }
    }

    /* ================== AI IDENTIFICATION PREVIEW (static, illustrative) ================== */
    (() => {
      const sec = $(".identify");
      if (!sec) return;
      const frame = $("#idvFrame"),
        photo = $(".idv-photo", sec),
        scan = $(".idv-scan", sec);
      const corners = $$(".idv-corner", sec),
        label = $(".idv-label", sec);
      const card = $("#idvCard"),
        fill = $("#idvBarFill"),
        num = $("#idvScoreNum");
      if (!frame || !card) return;

      try {
        // 1) photograph: clip-path reveal, then corners + label settle in
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: { trigger: frame, start: "top 80%", once: true },
          })
          .fromTo(
            frame,
            { clipPath: "inset(100% 0% 0% 0% round 28px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 28px)",
              duration: 1.4,
              ease: "power3.inOut",
              clearProps: "clipPath",
            },
            0,
          )
          .fromTo(
            corners,
            { autoAlpha: 0, scale: 0.7 },
            { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.08 },
            0.9,
          )
          .fromTo(
            label,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.7 },
            1.1,
          );

        // 2) subtle parallax + scale while scrolling past
        if (photo) {
          gsap.fromTo(
            photo,
            { scale: 1.14, yPercent: -2.5 },
            {
              scale: 1.06,
              yPercent: 2.5,
              ease: "none",
              scrollTrigger: {
                trigger: frame,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            },
          );
        }

        // 3) scanning line: continuous, paused while off-screen
        if (scan) {
          scan.style.animation = "none"; // hand over from the CSS fallback
          const sweep = gsap.fromTo(
            scan,
            { yPercent: -100 },
            {
              yPercent: 300,
              duration: 4.6,
              ease: "sine.inOut",
              repeat: -1,
              repeatDelay: 0.5,
            },
          );
          sweep.pause();
          ScrollTrigger.create({
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => (self.isActive ? sweep.play() : sweep.pause()),
          });
        }

        // 4) copy: staggered upward reveal
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: ".idv-copy",
              start: "top 78%",
              once: true,
            },
          })
          .fromTo(
            ".idv-eyebrow",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.7 },
            0,
          )
          .fromTo(
            ".idv-line > span",
            { yPercent: 115 },
            { yPercent: 0, duration: 1, stagger: 0.12, ease: "power4.out" },
            0.1,
          )
          .fromTo(
            ".idv-desc",
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.8 },
            0.55,
          );

        // 5) sample card + confidence bar 0 -> 98%
        const bar = { v: 0 };
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: { trigger: card, start: "top 85%", once: true },
          })
          .fromTo(
            card,
            { autoAlpha: 0, y: 44 },
            { autoAlpha: 1, y: 0, duration: 1, clearProps: "transform" },
            0,
          )
          .fromTo(
            ".idv-card-main > *",
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 },
            0.35,
          )
          .fromTo(
            fill,
            { scaleX: 0 },
            { scaleX: 0.98, duration: 1.6, ease: "power2.inOut" },
            0.6,
          )
          .to(
            bar,
            {
              v: 98,
              duration: 1.6,
              ease: "power2.inOut",
              onUpdate: () => {
                if (num) num.textContent = Math.round(bar.v);
              },
            },
            0.6,
          )
          .fromTo(
            ".idv-info-block",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 },
            0.9,
          )
          .fromTo(
            ".idv-actions",
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.7 },
            1.2,
          );
      } catch (err) {
        console.warn("Identify preview animation skipped:", err);
        gsap.set(sec.querySelectorAll("*"), { clearProps: "all" });
      }
    })();

    window.addEventListener("load", () => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh(true);
      });
    });
  });
})();