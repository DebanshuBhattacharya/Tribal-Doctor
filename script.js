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

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
    });
    tl.to(
      mainVisual,
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power3.inOut" },
      0,
    )
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.7 }, 0.1)
      .to(
        inners,
        { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.12 },
        0.22,
      )
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
  function initForestIllustration() {
    if (!canAnimate) return;
    const layers = $$(".jk-layer");
    const roots = $$(".jk-root");
    const labels = $$(".jk-flabel");
    if (!layers.length) return;

    gsap.set(labels, { opacity: 0, x: 12 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: ".jharkhand", start: "top 60%", once: true },
    });

    tl.to(layers, { opacity: 1, duration: 0.9, stagger: 0.25 }, 0)
      .to(
        roots,
        {
          strokeDashoffset: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power2.inOut",
        },
        0.5,
      )
      .to(labels, { opacity: 1, x: 0, duration: 0.6, stagger: 0.15 }, 0.8);
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
    tl.fromTo(
      ".biz-sheet",
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 0.9 },
      0,
    ).fromTo(
      ".biz-sheet-rows > div",
      { opacity: 0, x: 8 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.09 },
      0.35,
    );
  }

  /* ---------------- SUSTAINABILITY ---------------- */
  function initSustainabilityAnimation() {
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

  /* ---------------- COUNTERS (generic, reusable) ---------------- */
  function initCounters() {
    // This function stays as the general hook for future numeric counters
    // (e.g. stats on About / Communities pages). The plant-identify section
    // has its own real (non-demo) logic further down this file.
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
    initPinnedStory();
    initPassportTimeline();
    initProductInteractions();
    initForestIllustration();
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
/* ============================================================
   AI PLANT IDENTIFICATION
   Connects Tribal Doctor's landing-page identify section directly to
   the Van Vaidya AI backend.

   BACKEND CONTRACT — unchanged from before:
     POST <API_URL>   multipart/form-data, one field named "file"
     OK    { success: true, matches: [{ english_name, scientific_name,
                                        hindi_name, confidence }, ...] }
     Error { detail: "message" }   (non-2xx)
   matches[0] is the best match and is read exactly as before. Only the
   surrounding UI (drop zone, states, confidence ring, reset) is new.
   ============================================================ */

(function initPlantIdentification() {
  const stage = document.getElementById("identifyStage");
  const frame = document.getElementById("identifyFrame");
  const dropZone = document.getElementById("identifyButton");
  const fileInput = document.getElementById("plantImageInput");
  const preview = document.getElementById("identifyPreview");
  const resetButton = document.getElementById("identifyReset");

  const identifyStatus = document.getElementById("identifyStatus");
  const plantName = document.getElementById("plantName");
  const plantScientific = document.getElementById("plantScientific");
  const plantHindi = document.getElementById("plantHindi");
  const confidenceNum = document.getElementById("confidenceNum");
  const confidenceArc = document.getElementById("confidenceArc");
  const plantExplore = document.getElementById("plantExplore");

  if (!stage || !dropZone || !fileInput) return;

  // Backend endpoint (unchanged)
  const API_URL = "http://localhost:8000/identify";
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MIN_SCAN_MS = 700; // keep the scan visible even when the backend answers instantly

  const ORIGINAL_PREVIEW_SRC = preview ? preview.getAttribute("src") : "";
  const RING_R = confidenceArc ? Number(confidenceArc.getAttribute("r")) || 30 : 30;
  const RING_LEN = 2 * Math.PI * RING_R;
  if (confidenceArc) {
    confidenceArc.style.strokeDasharray = String(RING_LEN);
    confidenceArc.style.strokeDashoffset = String(RING_LEN);
  }

  let busy = false;
  let previewUrl = null;

  const setState = (state) => {
    stage.dataset.state = state;
  };

  const setConfidence = (percent) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
    if (confidenceArc) {
      confidenceArc.style.strokeDashoffset = String(RING_LEN * (1 - clamped / 100));
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function handleFile(file) {
    if (!file || busy) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Please choose a JPG, PNG or WebP photo.");
      return;
    }

    busy = true;
    setState("loading");

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (preview) preview.src = previewUrl;

    if (identifyStatus) identifyStatus.textContent = "Identifying plant...";
    if (plantName) plantName.textContent = "Reading the plant";
    if (plantScientific) plantScientific.textContent = "Please wait...";
    if (plantHindi) plantHindi.textContent = "Processing image";
    if (confidenceNum) confidenceNum.textContent = "—";
    setConfidence(0);
    if (plantExplore) {
      plantExplore.style.pointerEvents = "none";
      plantExplore.style.opacity = "0.5";
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const [response] = await Promise.all([
        fetch(API_URL, { method: "POST", body: formData }),
        wait(MIN_SCAN_MS),
      ]);

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null; // a non-JSON body shouldn't hide the real HTTP error
      }

      if (!response.ok) {
        throw new Error((data && data.detail) || "Plant identification failed.");
      }
      if (!data || !data.success || !Array.isArray(data.matches) || data.matches.length === 0) {
        throw new Error("No plant could be identified.");
      }

      // Get best match
      const plant = data.matches[0];

      if (plantName) plantName.textContent = plant.english_name || "Unknown plant";
      if (plantScientific) {
        plantScientific.textContent = plant.scientific_name || "Scientific name unavailable";
      }
      if (plantHindi) plantHindi.textContent = plant.hindi_name || "Hindi name unavailable";
      if (confidenceNum) confidenceNum.textContent = String(Math.round(plant.confidence || 0));
      setConfidence(plant.confidence);
      if (identifyStatus) identifyStatus.textContent = "Identification complete";

      // Enable Explore link
      if (plantExplore && plant.scientific_name) {
        plantExplore.href = `plants.html?plant=${encodeURIComponent(plant.scientific_name)}`;
        plantExplore.style.pointerEvents = "auto";
        plantExplore.style.opacity = "1";
      }

      setState("success");
    } catch (error) {
      console.error("Plant identification error:", error);

      if (identifyStatus) identifyStatus.textContent = "Identification failed";
      if (plantName) plantName.textContent = "Unable to identify";
      if (plantScientific) plantScientific.textContent = error.message || "Please try another image.";
      if (plantHindi) plantHindi.textContent = "Try a clearer plant photo";
      if (confidenceNum) confidenceNum.textContent = "—";
      setConfidence(0);

      setState("error");
    } finally {
      busy = false;
      fileInput.value = ""; // allow selecting the same image again
    }
  }

  // Clicking/choosing via the drop zone's own file input
  fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

  // Drag and drop, on both the drop zone and the photo frame
  const dropTargets = [dropZone, frame].filter(Boolean);
  dropTargets.forEach((target) => {
    ["dragenter", "dragover"].forEach((type) =>
      target.addEventListener(type, (event) => {
        event.preventDefault();
        target.classList.add("is-dragover");
      }),
    );
    ["dragleave", "drop"].forEach((type) =>
      target.addEventListener(type, (event) => {
        event.preventDefault();
        target.classList.remove("is-dragover");
      }),
    );
    target.addEventListener("drop", (event) => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  });

  // Stop the browser opening a file dropped outside the drop zone/frame
  ["dragover", "drop"].forEach((type) =>
    window.addEventListener(type, (event) => event.preventDefault()),
  );

  // "Try another photo" resets the card back to its idle state
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (busy) return;

      setState("idle");
      if (preview) preview.src = ORIGINAL_PREVIEW_SRC;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
      if (identifyStatus) identifyStatus.textContent = "Ready to identify";
      if (plantName) plantName.textContent = "No plant selected";
      if (plantScientific) plantScientific.textContent = "Upload a photo to begin";
      if (plantHindi) plantHindi.textContent = "—";
      if (confidenceNum) confidenceNum.textContent = "—";
      setConfidence(0);
      if (plantExplore) {
        plantExplore.href = "#";
        plantExplore.style.pointerEvents = "none";
        plantExplore.style.opacity = "0.5";
      }
      fileInput.value = "";
    });
  }

  // Every "Identify a Plant" link elsewhere on the page now points at
  // #identify instead of navigating away. Give the drop zone a brief
  // highlight once the smooth scroll lands, so it's obvious where to drop
  // a photo.
  document.querySelectorAll('a[href="#identify"]').forEach((link) => {
    link.addEventListener("click", () => {
      setTimeout(() => {
        dropZone.classList.add("pulse");
        dropZone.addEventListener(
          "animationend",
          () => dropZone.classList.remove("pulse"),
          { once: true },
        );
      }, 350);
    });
  });
})();