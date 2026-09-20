/* ==========================================================================
   TRIBAL DOCTOR — SCRIPT
   Organized init functions, each responsible for one part of the experience.
   ========================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------- LOADER ---------------- */
  function initLoader(onComplete) {
    const loader = document.getElementById("loader");
    if (!loader) return onComplete();

    if (prefersReducedMotion || !window.gsap) {
      loader.style.display = "none";
      return onComplete();
    }

    gsap.to(loader.querySelector(".loader-mark"), {
      scale: 1.08,
      duration: 0.6,
      ease: "power1.inOut",
    });
    gsap.to(loader, {
      opacity: 0,
      duration: 0.6,
      delay: 0.55,
      ease: "power2.inOut",
      onComplete: () => {
        loader.style.display = "none";
        onComplete();
      },
    });
  }

  /* ---------------- NAVBAR ---------------- */
  function initNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const setState = () => {
      if (window.scrollY > 40) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    };
    setState();
    window.addEventListener("scroll", setState, { passive: true });
  }

  /* ---------------- MOBILE MENU ---------------- */
  function initMobileMenu() {
    const btn = document.getElementById("hamburger");
    const menu = document.getElementById("mobileMenu");
    if (!btn || !menu) return;

    let open = false;
    const toggle = () => {
      open = !open;
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };

    btn.addEventListener("click", toggle);
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        if (open) toggle();
      }),
    );
  }

  /* ---------------- HERO ANIMATIONS ---------------- */
  function initHeroAnimations() {
    if (!window.gsap) return;
    const lines = document.querySelectorAll(".hero-heading .line");
    const eyebrow = document.querySelector(".hero-eyebrow");
    const sub = document.querySelector(".hero-sub");
    const ctas = document.querySelector(".hero-ctas");
    const stats = document.querySelector(".hero-stats");
    const mainVisual = document.getElementById("heroVisualMain");
    const secondaryVisual = document.getElementById("heroVisualSecondary");
    const tag = document.getElementById("heroVisualTag");

    if (prefersReducedMotion) {
      gsap.set([eyebrow, sub, ctas, stats, secondaryVisual, tag], {
        opacity: 1,
      });
      gsap.set(lines, { opacity: 1 });
      gsap.set(mainVisual, { clipPath: "inset(0% 0% 0% 0%)" });
      return;
    }

    gsap.set(lines, { yPercent: 110 });
    gsap.set([sub, stats], { opacity: 0, y: 16 });
    gsap.set(ctas, { opacity: 0, y: 12 });
    gsap.set(eyebrow, { opacity: 0, y: 10 });
    gsap.set(secondaryVisual, { opacity: 0, scale: 0.85 });
    gsap.set(tag, { opacity: 0, y: 10 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(
      mainVisual,
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power3.inOut" },
      0,
    )
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
      .to(lines, { yPercent: 0, duration: 0.9, stagger: 0.1 }, 0.35)
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
  }

  /* ---------------- GENERIC SCROLL REVEALS ---------------- */
  function initScrollAnimations() {
    if (!window.gsap) return;

    // trust strip words
    gsap.to(".trust-track span", {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: ".trust-strip", start: "top 85%" },
    });
    gsap.set(".trust-track span", { y: 10 });

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

    // business features
    gsap.to(".business-feature", {
      opacity: 1,
      y: 0,
      stagger: 0.06,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: ".business-features", start: "top 85%" },
    });
    gsap.set(".business-feature", { opacity: 0, y: 12 });

    // jharkhand region index list
    gsap.utils.toArray(".jharkhand-index-list li").forEach((li, i) => {
      ScrollTrigger.create({
        trigger: ".jharkhand",
        start: "top 55%",
        onEnter: () => {
          gsap.to(li, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: i * 0.08,
            ease: "power2.out",
            onStart: () => li.classList.add("in-view"),
          });
        },
      });
    });

    // sustainability image reveal + list
    gsap.to(".sustainability-media", {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1,
      ease: "power3.inOut",
      scrollTrigger: { trigger: ".sustainability", start: "top 65%" },
    });
    gsap.to(".sustainability-list li", {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: ".sustainability-list", start: "top 78%" },
    });
    gsap.utils.toArray(".sustainability-line").forEach((line) => {
      gsap.fromTo(
        line,
        { height: 0 },
        {
          height: "100%",
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: line, start: "top 85%" },
        },
      );
    });

    // final CTA
    gsap.fromTo(
      ".final-cta-content",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".final-cta", start: "top 65%" },
      },
    );
    gsap.to("#finalCtaBotanical path", {
      strokeDashoffset: 0,
      duration: 2,
      stagger: 0.15,
      ease: "power2.inOut",
      scrollTrigger: { trigger: ".final-cta", start: "top 70%" },
    });
  }

  /* ---------------- PINNED STORY ---------------- */
  function initPinnedStory() {
    if (!window.gsap) return;
    const pin = document.querySelector(".story-pin");
    const stages = gsap.utils.toArray(".story-stage");
    const progressBar = document.getElementById("storyProgressBar");
    if (!pin || !stages.length) return;

    if (prefersReducedMotion) {
      stages.forEach((s) => gsap.set(s, { opacity: 1, position: "relative" }));
      return;
    }

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
      const img = stage.querySelector(".story-visual img");
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
    if (!window.gsap) return;
    const steps = gsap.utils.toArray(".passport-step");
    const lineFill = document.getElementById("passportLineFill");
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
    if (!window.gsap) return;
    const section = document.getElementById("identify");
    const scanLine = document.getElementById("scanLine");
    const card = document.getElementById("identifyCard");
    const markers = document.querySelectorAll(".marker");
    if (!section) return;

    let played = false;

    const play = () => {
      if (played) return;
      played = true;

      if (prefersReducedMotion) {
        gsap.set(card, { opacity: 1, y: 0 });
        const num = document.getElementById("confidenceNum");
        if (num) num.textContent = "92";
        return;
      }

      const tl = gsap.timeline();
      tl.set(card, { opacity: 0, y: 20 })
        .to(scanLine, { opacity: 1, duration: 0.2 })
        .to(scanLine, { top: "100%", duration: 1.1, ease: "power1.inOut" })
        .to(scanLine, { opacity: 0, duration: 0.2 }, "-=0.1")
        .to(
          markers,
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            stagger: 0.15,
            ease: "back.out(2)",
          },
          "-=0.5",
        )
        .to(
          card,
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.2",
        )
        .to(
          {},
          {
            duration: 0.9,
            onUpdate: function () {
              const num = document.getElementById("confidenceNum");
              if (num) num.textContent = Math.round(this.progress() * 92);
            },
          },
        );
    };

    ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      onEnter: play,
    });
  }

  /* ---------------- COUNTERS (generic, reusable) ---------------- */
  function initCounters() {
    // confidence counter is handled inside initPlantIdentification.
    // This function stays as the general hook for future numeric counters
    // (e.g. stats on About / Communities pages).
  }

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function initMagneticButtons() {
    if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches)
      return;
    const items = document.querySelectorAll("[data-magnetic]");

    items.forEach((el) => {
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
    if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches)
      return;
    const dot = document.getElementById("cursorDot");
    if (!dot || !window.gsap) return;

    window.addEventListener("mousemove", (e) => {
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    });

    document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
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
    initHeroAnimations();
    initScrollAnimations();
    initPinnedStory();
    initPassportTimeline();
    initProductInteractions();
    initPlantIdentification();
    initCounters();
    initMagneticButtons();
    initCursor();

    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLoader(bootstrap);
  });
})();
