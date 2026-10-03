/* Tribal Doctor — Knowledge Passport. Replace passportData with an API response later. */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Shown only if an image fails to load
  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000'><rect width='1600' height='1000' fill='#e6d5bf'/><g fill='none' stroke='#536b4f' stroke-width='4' opacity='.8'><path d='M800 980V420'/><path d='M800 700C700 650 630 560 650 460c90 20 150 110 150 240Z'/><path d='M800 600C900 550 970 460 950 360c-90 20-150 110-150 240Z'/></g></svg>",
    );

  // Record comes from passport-data.js, chosen by ?id=
  const passportData = TKP_getRecord(location.search);

  function loadImg(im, src) {
    im.onerror = () => {
      im.onerror = null;
      im.src = placeholder;
    };
    im.referrerPolicy = "no-referrer";
    im.src = src;
  }

  function renderPassportData() {
    const d = passportData,
      k = d.knowledge;
    document.title = `${d.id} — Knowledge Passport · Tribal Doctor`;
    const region = d.region || "";
    const mrz =
      (d.id + "<<" + (d.plant.commonName || "") + "<<" + ((d.region || "").split(",")[0] || "UNRECORDED") + "<<" + (d.year || ""))
        .toUpperCase()
        .replace(/[^A-Z0-9<-]/g, "<") + "<".repeat(40);
    const map = {
      id: d.id,
      commonName: d.plant.commonName,
      scientificName: d.plant.scientificName,
      family: d.plant.family,
      localNames: d.plant.localNames,
      region,
      regionUpper: region.replace(",", " ·").toUpperCase(),
      community: d.community,
      year: d.year,
      issued: d.issued,
      status: d.status,
      contribName: d.contributor && d.contributor.name,
      use: k.use,
      method: k.method,
      part: k.part,
      context: k.context,
      originMain: d.origin && d.origin.main,
      originSub: d.origin && d.origin.sub,
      coords: d.coords,
      source: d.source,
      mrz,
    };
    // Empty or missing values show a dash, never "undefined"
    $$("[data-bind]").forEach((el) => {
      const v = map[el.dataset.bind];
      el.textContent = v == null || String(v).trim() === "" ? "—" : v;
    });
    $$("[data-img]").forEach((el) => {
      if (el.dataset.img === "hero") el.alt = d.plant.commonName + " photograph";
      loadImg(el, d.images[el.dataset.img]);
    });
    const coordsEl = $(".coords");
    if (coordsEl && !d.coords) coordsEl.style.display = "none";

    // Passport photo window: one stacked slide per gallery image
    const gallery = d.images.gallery && d.images.gallery.length
      ? d.images.gallery
      : [{ src: d.images.hero, caption: "" }];
    const box = $("#ppImgs");
    box.innerHTML = "";
    gallery.forEach((g) => {
      const slide = document.createElement("div");
      slide.className = "slide";
      const im = document.createElement("img");
      im.alt = g.caption || d.plant.commonName;
      loadImg(im, g.src);
      slide.appendChild(im);
      if (g.caption) {
        const cap = document.createElement("span");
        cap.className = "pp-cap";
        cap.textContent = g.caption;
        slide.appendChild(cap);
      }
      box.appendChild(slide);
    });

    // Decorative QR placeholder seeded by ID (not scannable)
    let s = 0;
    for (const c of d.id) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const f = (x, y) =>
      `<path fill-rule="evenodd" d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    let out = f(0, 0) + f(14, 0) + f(0, 14);
    for (let y = 0; y < 21; y++)
      for (let x = 0; x < 21; x++) {
        if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
        if (r() > 0.52) out += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    $("#qr").innerHTML = out;
  }

  // "Related records": the next few plants in the register
  function renderRelated() {
    const track = $(".rel-track");
    if (!track || typeof TKP_all !== "function") return;
    const all = TKP_all();
    const i = all.findIndex((p) => p.id === passportData.id);
    const others = all.filter((p) => p.id !== passportData.id);
    const start = i < 0 ? 0 : i % Math.max(others.length, 1);
    const picks = others.slice(start).concat(others.slice(0, start)).slice(0, 4);
    track.innerHTML = "";
    picks.forEach((p, n) => {
      const a = document.createElement("a");
      a.className = "rel";
      a.href = TKP_url(p.id);
      const num = document.createElement("span");
      num.textContent = String(n + 1).padStart(2, "0");
      const h3 = document.createElement("h3");
      h3.textContent = p.commonName;
      const em = document.createElement("em");
      em.textContent = p.scientificName;
      a.append(num, h3, em);
      track.appendChild(a);
    });
  }

  // Page load: the photograph settles, then the plant name arrives
  function initIntroAnimation() {
    gsap.from("#photo img", { scale: 1.14, duration: 2.2, ease: "power2.out" });
    gsap.from(".nav, .kicker", { opacity: 0, y: -10, duration: 0.8, delay: 0.2 });
    gsap.from("[data-s='1'] .st-in", {
      opacity: 0,
      y: 44,
      duration: 1.1,
      delay: 0.35,
      ease: "power3.out",
    });
  }

  function initNavigation() {
    const nav = $("#nav");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        const y = self.scroll();
        nav.classList.toggle("solid", y > 80);
        gsap.to(nav, {
          yPercent: self.direction === 1 && y > 300 ? -100 : 0,
          duration: 0.35,
          overwrite: true,
        });
      },
    });
  }

  /* One master timeline, one pin. Stage i sits at time i*2: enter t+.1, hold, exit t+1.5. */
  function initPassportExperience() {
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 801px)", mob: "(max-width: 800px)" }, (ctx) => {
      const mob = ctx.conditions.mob;
      const stages = $$(".stage"),
        pp = $("#pp"),
        exp = $("#exp");
      const bgs = ["#fbfaf6", "#f3eddf", "#e9dfca", "#f3eddf", "#eee6d4", "#fbfaf6"];

      // Position and size of the passport's photo window, relative to #exp
      const win = () => {
        const im = $(".pp-img");
        return {
          left: pp.offsetLeft + im.offsetLeft,
          top: pp.offsetTop + im.offsetTop,
          width: im.offsetWidth,
          height: im.offsetHeight,
        };
      };

      gsap.set(stages[0], { autoAlpha: 1 });
      gsap.set(pp, { opacity: 0 });
      gsap.set("#photo", {
        opacity: 1,
        left: 0,
        top: 0,
        width: () => exp.clientWidth,
        height: () => exp.clientHeight,
      });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: "#exp",
          start: "top top",
          end: mob ? "+=3800" : "+=6000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) =>
            setCount(Math.min(6, Math.floor((self.progress * tl.duration()) / 2 + 0.25) + 1)),
        },
      });

      stages.forEach((st, i) => {
        const t = i * 2,
          items = $$("[data-in]", st);

        if (i > 0) {
          // ENTER: new information rises in while the old one has left
          tl.set(st, { autoAlpha: 1 }, t + 0.1);
          tl.fromTo(
            items,
            { y: 44, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
            t + 0.1,
          );
          tl.fromTo(
            items.filter((e) => /^H[12]$/.test(e.tagName)),
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: 0.5 },
            t + 0.1,
          );
          tl.to("#exp", { backgroundColor: bgs[i], duration: 1 }, t - 0.2);
        }

        if (i === 1) {
          tl.to(".counter, .prog", { opacity: 1, duration: 0.5 }, t);
          // Hero photo shrinks into the passport's photo window
          tl.to(
            "#photo",
            {
              left: () => win().left,
              top: () => win().top,
              width: () => win().width,
              height: () => win().height,
              duration: 1.4,
              ease: "power3.inOut",
            },
            t - 0.2,
          );
          // Passport appears around it, then the hero hands over to the matching gallery image
          tl.fromTo(pp, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "none" }, t + 0.7);
          tl.to("#photo", { opacity: 0, duration: 0.4, ease: "none" }, t + 1);
        }

        // EXIT (all but the last stage)
        if (i < 5) {
          tl.to(
            items,
            { y: -40, opacity: 0, stagger: 0.04, duration: 0.4, ease: "power2.in" },
            t + 1.5,
          );
          tl.set(st, { autoAlpha: 0 }, t + 1.95);
        }
      });

      // Passport photo window: each new image fades and settles in over the previous one
      const slides = $$(".pp-img .slide");
      if (slides.length > 1) {
        const from = 3.8,
          span = 6.2; // first change at stage 03, last at stage 06
        const step = slides.length > 2 ? span / (slides.length - 2) : 0;
        slides.slice(1).forEach((s, j) => {
          tl.fromTo(
            s,
            { opacity: 0, scale: 1.1 },
            { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out" },
            from + j * step,
          );
        });
      }

      tl.fromTo(".flow-line", { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none" }, 6.5);
      tl.fromTo(
        ".pp-extra",
        { clipPath: "inset(100% 0 0 0)" },
        { clipPath: "inset(0% 0 0 0)", duration: 0.8 },
        6.6,
      );
      tl.to(".prog i", { scaleY: 1, ease: "none", duration: 11.4 }, 0);
      tl.to({}, { duration: 1.2 }, 10.2); // final hold, then release
    });
  }

  let shown = 1;
  function setCount(n) {
    if (n === shown) return;
    shown = n;
    const el = $("#cnt");
    gsap
      .timeline({ overwrite: true })
      .to(el, { y: -8, opacity: 0, duration: 0.15 })
      .add(() => {
        el.textContent = String(n).padStart(2, "0");
      })
      .fromTo(el, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });
  }

  function initRelatedKnowledge() {
    gsap.from(".rel", {
      opacity: 0,
      x: 60,
      stagger: 0.1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".rel-track", start: "top 85%", once: true },
    });
    gsap.from(".related .label, .related .display", {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 1,
      scrollTrigger: { trigger: ".related", start: "top 75%", once: true },
    });
    gsap.from(".cta .clip > span", {
      yPercent: 105,
      stagger: 0.14,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".cta", start: "top 60%", once: true },
    });
    gsap.from(".cta-sub, .btns .btn", {
      opacity: 0,
      y: 20,
      stagger: 0.12,
      duration: 0.8,
      scrollTrigger: { trigger: ".cta", start: "top 40%", once: true },
    });
  }

  // Reduced motion or GSAP missing: no pin, everything readable
  function initReducedMotion() {
    document.documentElement.classList.remove("js");
    document.documentElement.classList.add("static");
  }

  renderPassportData();
  renderRelated();
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !window.gsap ||
    !window.ScrollTrigger
  )
    return initReducedMotion();
  gsap.registerPlugin(ScrollTrigger);
  initIntroAnimation();
  initNavigation();
  initPassportExperience();
  initRelatedKnowledge();
  const refresh = () => ScrollTrigger.refresh();
  addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(refresh, 200);
  });
})();