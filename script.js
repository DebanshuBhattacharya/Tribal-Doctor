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
  const canAnimate = !!(window.gsap && window.ScrollTrigger) && !prefersReducedMotion;
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
    $$("a", menu).forEach((a) => a.addEventListener("click", () => open && set(false)));
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
    const mainVisual = $("#heroVisualMain");
    const secondaryVisual = $("#heroVisualSecondary");
    const tag = $("#heroVisualTag");

    // Each heading line's text sits below its clipping mask, then slides up into it.
    gsap.set(inners, { yPercent: 118 });
    gsap.set(eyebrow, { opacity: 0, y: 10 });
    gsap.set([sub, stats], { opacity: 0, y: 16 });
    gsap.set(ctas, { opacity: 0, y: 12 });
    gsap.set(secondaryVisual, { opacity: 0, scale: 0.85 });
    gsap.set(tag, { opacity: 0, y: 10 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    tl.to(
      mainVisual,
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power3.inOut" },
      0,
    )
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.7 }, 0.1)
      .to(inners, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.12 }, 0.22)
      .to(sub, { opacity: 1, y: 0, duration: 0.8 }, 0.75)
      .to(ctas, { opacity: 1, y: 0, duration: 0.7 }, 0.9)
      .to(
        secondaryVisual,
        { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.4)" },
        0.6,
      )
      .to(tag, { opacity: 1, y: 0, duration: 0.6 }, 1.0)
      .to(stats, { opacity: 1, y: 0, duration: 0.7 }, 1.1);

    // subtle continuous drift on the visual column while in view
    gsap.to(".hero-visual", {
      yPercent: -4,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

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

    // WHY section
    gsap.to(".why-media", {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.1,
      ease: "power3.inOut",
      scrollTrigger: { trigger: ".why", start: "top 70%" },
    });
    gsap.fromTo(
      ".why-statement",
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".why", start: "top 65%" },
      },
    );
    gsap.to(".why-line path", {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: "power2.inOut",
      scrollTrigger: { trigger: ".why", start: "top 55%" },
    });
    gsap.to(".why-text", {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: { trigger: ".why", start: "top 45%" },
    });

    // product cards
    gsap.utils.toArray(".product-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: (i % 4) * 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 88%" },
        },
      );
    });

    // community panels
    gsap.utils.toArray(".community-panel").forEach((panel) => {
      gsap.to(panel, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1,
        ease: "power3.inOut",
        scrollTrigger: { trigger: panel, start: "top 85%" },
      });
    });
  }

  /* ---------------- JHARKHAND MAP ----------------
     Region list and map pins highlight each other (hover, focus, or tap). */
  function initJharkhandMap() {
    const rows = $$(".jk-region");
    const pins = $$(".jk-pin");
    if (!rows.length || !pins.length) return;

    const setActive = (name) => {
      rows.forEach((r) => r.classList.toggle("is-active", r.dataset.region === name));
      pins.forEach((p) => p.classList.toggle("is-active", p.dataset.region === name));
    };
    const clear = () => setActive(null);

    rows.forEach((row) => {
      const name = row.dataset.region;
      row.addEventListener("mouseenter", () => setActive(name));
      row.addEventListener("mouseleave", clear);
      row.addEventListener("focus", () => setActive(name));
      row.addEventListener("blur", clear);
      row.addEventListener("click", () => setActive(name)); // touch: tap to highlight
    });
    pins.forEach((pin) => {
      const name = pin.dataset.region;
      pin.addEventListener("mouseenter", () => setActive(name));
      pin.addEventListener("mouseleave", clear);
    });
  }

  /* One orchestrated moment: the outline draws itself, terrain rings settle in, pins drop, list follows. */
  function initJharkhandAnimation() {
    if (!canAnimate) return;
    const outline = $(".jk-outline");
    if (!outline) return;

    const grat = $(".jk-grat");
    const fill = $(".jk-fill");
    const rings = $$(".jk-ring");
    const pins = $$(".jk-pin");
    const dots = $$(".jk-pin-dot");
    const labels = $$(".jk-pin-label");
    const rows = $$(".jk-region");

    gsap.set([grat, fill, ...rings], { opacity: 0 });
    gsap.set(pins, { opacity: 0 });
    gsap.set(dots, { scale: 0 });
    gsap.set(labels, { x: -6 });
    gsap.set(rows, { opacity: 0, x: -10 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: ".jharkhand", start: "top 55%", once: true },
    });
    tl.to(grat, { opacity: 1, duration: 1 }, 0)
      .to(outline, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, 0.1)
      .to(fill, { opacity: 1, duration: 1.2 }, 1)
      .to(rings, { opacity: 1, duration: 1, stagger: 0.14 }, 1)
      .to(rows, { opacity: 1, x: 0, duration: 0.6, stagger: 0.09 }, 0.5)
      .to(pins, { opacity: 1, duration: 0.4, stagger: 0.16 }, 1.7)
      .to(dots, { scale: 1, duration: 0.55, stagger: 0.16, ease: "back.out(2.6)" }, 1.7)
      .to(labels, { x: 0, duration: 0.5, stagger: 0.16 }, 1.8);
  }

  /* ---------------- BUSINESS ---------------- */
  function initBusinessAnimation() {
    if (!canAnimate || !$(".business")) return;

    gsap.fromTo(
      ".biz-list li",
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: ".biz-list", start: "top 85%", once: true },
      },
    );

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: ".biz-stack", start: "top 78%", once: true },
    });
    tl.fromTo(".biz-sheet", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.9 }, 0)
      .fromTo(
        ".biz-sheet-rows > div",
        { opacity: 0, x: 8 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.09 },
        0.35,
      );
  }

  /* ---------------- SUSTAINABILITY ---------------- */
  function initSustainabilityAnimation() {
    if (!canAnimate || !$(".sustainability")) return;

    const trigger = { trigger: ".sustainability", start: "top 60%", once: true };
    gsap.fromTo(
      ".sus-media",
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power3.inOut", scrollTrigger: trigger },
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

  /* ---------------- FINAL CTA ---------------- */
  function initFinalCtaAnimation() {
    if (!canAnimate || !$(".final-cta")) return;

    gsap.fromTo(
      ".cta-head",
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".final-cta", start: "top 60%", once: true },
      },
    );
    gsap.fromTo(
      ".cta-path",
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-paths", start: "top 85%", once: true },
      },
    );
    // line drawings trace themselves in once the panels have arrived
    gsap.to(".cta-path .draw", {
      strokeDashoffset: 0,
      duration: 1.8,
      stagger: 0.12,
      delay: 0.4,
      ease: "power2.inOut",
      scrollTrigger: { trigger: ".cta-paths", start: "top 80%", once: true },
    });
    gsap.to(".cta-path .scan-dot", {
      opacity: 1,
      duration: 0.5,
      stagger: 0.2,
      delay: 1.8,
      scrollTrigger: { trigger: ".cta-paths", start: "top 80%", once: true },
    });
  }

  /* ---------------- PINNED STORY ---------------- */
  function initPinnedStory() {
    if (!canAnimate) return;
    const pin = $(".story-pin");
    const stages = gsap.utils.toArray(".story-stage");
    const progressBar = $("#storyProgressBar");
    if (!pin || !stages.length) return;

    gsap.set(stages.slice(1), { opacity: 0 });
    gsap.set(".story-visual img", { scale: 1.15 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: `+=${stages.length * 100}%`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
        },
      },
    });

    stages.forEach((stage, i) => {
      const img = $(".story-visual img", stage);
      if (i > 0) {
        tl.to(stages[i - 1], { opacity: 0, duration: 0.3 }, i);
        tl.to(stage, { opacity: 1, duration: 0.3 }, i);
      }
      tl.to(img, { scale: 1, duration: 0.6 }, i);
      tl.to({}, { duration: 0.4 }); // hold
    });
  }

  /* ---------------- KNOWLEDGE PASSPORT TIMELINE ---------------- */
  function initPassportTimeline() {
    if (!canAnimate) return;
    const steps = gsap.utils.toArray(".passport-step");
    const lineFill = $("#passportLineFill");
    if (!steps.length) return;

    gsap.to(steps, {
      opacity: 1,
      x: 0,
      stagger: 0.12,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".passport-timeline",
        start: "top 75%",
        end: "bottom 60%",
      },
    });

    if (lineFill) {
      gsap.to(lineFill, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: ".passport-timeline",
          start: "top 60%",
          end: "bottom 70%",
          scrub: true,
        },
      });
    }
  }

  /* ---------------- PRODUCT CARD INTERACTIONS ---------------- */
  function initProductInteractions() {
    // handled primarily via CSS hover states; JS reserved for future
    // richer interactions (quick-view, wishlist, etc.) on later pages.
  }

  /* ---------------- PLANT IDENTIFICATION DEMO ---------------- */
  function initPlantIdentification() {
    if (!canAnimate) return;
    const section = $("#identify");
    const scanLine = $("#scanLine");
    const card = $("#identifyCard");
    const markers = $$(".marker");
    const num = $("#confidenceNum");
    if (!section || !card) return;

    // starting state is set now, not when the animation plays, so the card never flashes on screen first
    gsap.set(card, { opacity: 0, y: 20 });
    if (num) num.textContent = "0";

    let played = false;
    const play = () => {
      if (played) return;
      played = true;

      const tl = gsap.timeline();
      tl.to(scanLine, { opacity: 1, duration: 0.2 })
        .to(scanLine, { top: "100%", duration: 1.1, ease: "power1.inOut" })
        .to(scanLine, { opacity: 0, duration: 0.2 }, "-=0.1")
        .to(
          markers,
          { opacity: 1, scale: 1, duration: 0.4, stagger: 0.15, ease: "back.out(2)" },
          "-=0.5",
        )
        .to(card, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.2")
        .to(
          {},
          {
            duration: 0.9,
            onUpdate: function () {
              if (num) num.textContent = Math.round(this.progress() * 92);
            },
          },
        );
    };

    ScrollTrigger.create({ trigger: section, start: "top 60%", onEnter: play });
  }

  /* ---------------- COUNTERS (generic, reusable) ---------------- */
  function initCounters() {
    // confidence counter is handled inside initPlantIdentification.
    // This function stays as the general hook for future numeric counters
    // (e.g. stats on About / Communities pages).
  }

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function initMagneticButtons() {
    if (!canAnimate || window.matchMedia("(pointer: coarse)").matches) return;

    $$("[data-magnetic]").forEach((el) => {
      let bounds;
      const strength = 0.28;

      const onEnter = () => (bounds = el.getBoundingClientRect());
      const onMove = (e) => {
        if (!bounds) bounds = el.getBoundingClientRect();
        const relX = e.clientX - (bounds.left + bounds.width / 2);
        const relY = e.clientY - (bounds.top + bounds.height / 2);
        gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.4, ease: "power2.out" });
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
      gsap.to(dot, { x: e.clientX, y: e.clientY, opacity: 1, duration: 0.35, ease: "power2.out" });
    });

    $$("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => gsap.to(dot, { scale: 2.4, duration: 0.25 }));
      el.addEventListener("mouseleave", () => gsap.to(dot, { scale: 1, duration: 0.25 }));
    });
  }

  /* ---------------- INIT ALL ---------------- */
  function bootstrap() {
    initNavbar();
    initMobileMenu();
    initJharkhandMap();
    const playHero = initHeroAnimations();
    initScrollAnimations();
    initPinnedStory();
    initPassportTimeline();
    initProductInteractions();
    initPlantIdentification();
    initJharkhandAnimation();
    initBusinessAnimation();
    initSustainabilityAnimation();
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
        ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
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