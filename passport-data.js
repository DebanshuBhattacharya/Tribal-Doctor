/* Tribal Doctor — passport register (works for ~20 plants, add more freely).
   Shared by identify.html (finds a passport for an identified plant)
   and passport.html (renders the record).

   HOW TO DOCUMENT A PLANT: find its line in LISTED below, then add the real
   community details by giving it a 6th value, e.g.
     ["TKP-000126", "Neem", "Azadirachta indica", "Meliaceae", "नीम", {
        region: "Palamu, Jharkhand", origin: { main: "Palamu", sub: "Jharkhand" },
        community: "…", contributor: { name: "…", community: "…" }, year: "2026",
        issued: "12 Jan 2026", status: "Documented", source: "Community contribution",
        knowledge: { use: "…", method: "…", part: "…", context: "…" },
        images: { hero: "…", gallery: [{ src: "…", caption: "…" }] },
        aliases: ["other scientific names"], names: ["other common names"]
     }]
   Anything left out shows as "—" on the passport. */
(function () {
  "use strict";

  /* Fully documented record(s) */
  const DOCUMENTED = [
    {
      id: "TKP-000125",
      aliases: ["Withania somnifera"],
      names: ["Winter cherry", "Indian ginseng"],
      plant: {
        commonName: "Ashwagandha",
        scientificName: "Withania somnifera",
        family: "Solanaceae",
        localNames: "Ashwagandha, Asgandh",
      },
      region: "Palamu, Jharkhand",
      origin: { main: "Palamu", sub: "Jharkhand" },
      coords: "24.0° N   84.1° E",
      source: "Community contribution",
      community: "Example Community",
      year: "2026",
      issued: "12 Jan 2026",
      status: "Documented",
      contributor: {
        name: "Example Contributor",
        community: "Example Community",
      },
      knowledge: {
        use: "Documented by the community as a restorative root taken during recovery and seasonal weakness.",
        method:
          "Root is cleaned, dried in shade, ground to powder and mixed with warm milk or water.",
        part: "Root",
        context:
          "Shared within families in colder months and passed from elders to younger members.",
      },
      images: {
        hero: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ5BAMdWkwqqMbOdZo6HeIMtwCPd3driYsUbBTUfgJcQ&s=10",
        // gallery[0] should match hero so the hand-over is seamless
        gallery: [
          {
            src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ5BAMdWkwqqMbOdZo6HeIMtwCPd3driYsUbBTUfgJcQ&s=10",
            caption: "Whole plant",
          },
          {
            src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_uLslOZx28OxWVGU_EVrkS7tljqjaCnJbKdkdxvJ1tg&s=10",
            caption: "Fresh root",
          },
          {
            src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLZMu7L2TsRyzpDBz20ZYBV6boRy8d2PlTivDcDbA76w&s=10",
            caption: "Dried root",
          },
          {
            src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmQwLixiZoT_mtIC11c2Al2l1zF-2Vv1fmoLx7qDcCQA&s=10",
            caption: "Powder",
          },
          {
            src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpfI3ZGNde5_LCIBQRDKjEl1LCRQEFWJrYd60e3_6zAw&s=10",
            caption: "Traditional use",
          },
        ],
      },
    },
  ];

  /* Plants listed with botanical facts only: [id, English name, scientific name, family, Hindi name, optional details] */
  const LISTED = [
    [
      "TKP-000126",
      "Neem",
      "Azadirachta indica",
      "Meliaceae",
      "नीम",
      { aliases: ["Melia azadirachta"], names: ["Indian lilac"] },
    ],
    [
      "TKP-000127",
      "Tulsi",
      "Ocimum tenuiflorum",
      "Lamiaceae",
      "तुलसी",
      { aliases: ["Ocimum sanctum"], names: ["Holy Basil", "Holy basil"] },
    ],
    [
      "TKP-000128",
      "Giloy",
      "Tinospora cordifolia",
      "Menispermaceae",
      "गिलोय",
      { names: ["Guduchi", "Heart-leaved moonseed"] },
    ],
    [
      "TKP-000129",
      "Mahua",
      "Madhuca longifolia",
      "Sapotaceae",
      "महुआ",
      { aliases: ["Madhuca indica"], names: ["Butter tree", "Mahwa"] },
    ],
    [
      "TKP-000130",
      "Aloe vera",
      "Aloe vera",
      "Asphodelaceae",
      "घृतकुमारी",
      { aliases: ["Aloe barbadensis"], names: ["Aloe", "Indian aloe"] },
    ],
    [
      "TKP-000131",
      "Turmeric",
      "Curcuma longa",
      "Zingiberaceae",
      "हल्दी",
      { names: ["Haldi"] },
    ],
    [
      "TKP-000132",
      "Amla",
      "Phyllanthus emblica",
      "Phyllanthaceae",
      "आंवला",
      {
        aliases: ["Emblica officinalis"],
        names: ["Indian gooseberry", "Amalaki"],
      },
    ],
    [
      "TKP-000133",
      "Brahmi",
      "Bacopa monnieri",
      "Plantaginaceae",
      "ब्राह्मी",
      { names: ["Water hyssop"] },
    ],
    [
      "TKP-000134",
      "Arjun",
      "Terminalia arjuna",
      "Combretaceae",
      "अर्जुन",
      { names: ["Arjuna"] },
    ],
    [
      "TKP-000135",
      "Haritaki",
      "Terminalia chebula",
      "Combretaceae",
      "हरड़",
      { names: ["Harad", "Chebulic myrobalan"] },
    ],
    [
      "TKP-000136",
      "Bael",
      "Aegle marmelos",
      "Rutaceae",
      "बेल",
      { names: ["Bengal quince", "Stone apple"] },
    ],
    [
      "TKP-000137",
      "Sarpagandha",
      "Rauvolfia serpentina",
      "Apocynaceae",
      "सर्पगंधा",
      { names: ["Indian snakeroot"] },
    ],
    [
      "TKP-000138",
      "Kalmegh",
      "Andrographis paniculata",
      "Acanthaceae",
      "कालमेघ",
      { names: ["Green chiretta"] },
    ],
    [
      "TKP-000139",
      "Shatavari",
      "Asparagus racemosus",
      "Asparagaceae",
      "शतावरी",
      {},
    ],
    [
      "TKP-000140",
      "Sal",
      "Shorea robusta",
      "Dipterocarpaceae",
      "साल",
      { names: ["Sal tree"] },
    ],
    [
      "TKP-000141",
      "Karanj",
      "Millettia pinnata",
      "Fabaceae",
      "करंज",
      {
        aliases: ["Pongamia pinnata", "Pongamia glabra"],
        names: ["Indian beech", "Pongame oil tree"],
      },
    ],
    [
      "TKP-000142",
      "Palash",
      "Butea monosperma",
      "Fabaceae",
      "पलाश",
      { aliases: ["Butea frondosa"], names: ["Flame of the forest"] },
    ],
    [
      "TKP-000143",
      "Bhringraj",
      "Eclipta prostrata",
      "Asteraceae",
      "भृंगराज",
      { aliases: ["Eclipta alba"], names: ["False daisy"] },
    ],
    [
      "TKP-000144",
      "Moringa",
      "Moringa oleifera",
      "Moringaceae",
      "सहजन",
      { names: ["Drumstick tree"] },
    ],
  ];

  const NO_PHOTO =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000'><rect width='1600' height='1000' fill='#e6d5bf'/><g fill='none' stroke='#536b4f' stroke-width='4' opacity='.8'><path d='M800 980V420'/><path d='M800 700C700 650 630 560 650 460c90 20 150 110 150 240Z'/><path d='M800 600C900 550 970 460 950 360c-90 20-150 110-150 240Z'/></g></svg>",
    );

  const thisYear = String(new Date().getFullYear());

  function listed([id, common, sci, family, hindi, extra]) {
    return Object.assign(
      {
        id,
        plant: {
          commonName: common,
          scientificName: sci,
          family,
          localNames: [common, hindi].join(", "),
        },
        hindiName: hindi,
        region: "",
        origin: { main: "Origin", sub: "not yet recorded" },
        coords: "",
        source: "Plant register",
        community: "",
        year: thisYear,
        issued: thisYear,
        status: "Listed",
        contributor: { name: "", community: "" },
        knowledge: {
          use: "No community knowledge has been documented for this plant yet.",
          method: "",
          part: "",
          context: "",
        },
      },
      extra || {},
    );
  }

  const PASSPORTS = DOCUMENTED.concat(LISTED.map(listed));

  const norm = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  /* "Withania somnifera (L.) Dunal" -> "withania somnifera" */
  const binomial = (s) =>
    norm(s)
      .replace(/[^a-z ]/g, "")
      .split(" ")
      .slice(0, 2)
      .join(" ");

  function matches(p, sci, common) {
    const sciNames = [p.plant.scientificName]
      .concat(p.aliases || [])
      .map(binomial);
    const commonNames = [p.plant.commonName].concat(p.names || []).map(norm);
    return (
      (sci.includes(" ") && sciNames.includes(sci)) ||
      (!!common && commonNames.includes(common))
    );
  }

  /* photo from the identify page, if any */
  function userPhoto() {
    try {
      return sessionStorage.getItem("td_photo") || "";
    } catch (e) {
      return "";
    }
  }

  /* a record with no photos of its own shows the person's photo, else a placeholder */
  function withImages(rec) {
    if (rec.images) return rec;
    const photo = userPhoto();
    const src = photo || NO_PHOTO;
    return Object.assign({}, rec, {
      images: {
        hero: src,
        gallery: [{ src, caption: photo ? "Your photo" : "" }],
      },
    });
  }

  /* documented passport id for an identified plant, or null */
  window.TKP_findPassportId = function (scientificName, commonName) {
    const sci = binomial(scientificName);
    const common = norm(commonName);
    const hit = PASSPORTS.find((p) => matches(p, sci, common));
    return hit ? hit.id : null;
  };

  /* passport link for ANY identified plant: the register entry if there is
     one, otherwise a passport built from the identification itself */
  window.TKP_passportUrl = function (match) {
    if (!match) return "";
    const id = window.TKP_findPassportId(
      match.scientific_name,
      match.english_name,
    );
    if (id) return "passport.html?id=" + encodeURIComponent(id);
    if (!match.scientific_name && !match.english_name) return "";
    const q = new URLSearchParams();
    if (match.scientific_name) q.set("sci", match.scientific_name);
    if (match.english_name) q.set("name", match.english_name);
    if (match.hindi_name) q.set("hi", match.hindi_name);
    return "passport.html?" + q.toString();
  };

  window.TKP_url = function (id) {
    return "passport.html?id=" + encodeURIComponent(id);
  };

  window.TKP_rememberMatch = function (id, match) {
    try {
      sessionStorage.setItem("td_match_" + id, JSON.stringify(match));
    } catch (e) {
      /* storage unavailable: skip */
    }
  };

  /* every register entry (for the "related records" row) */
  window.TKP_all = function () {
    return PASSPORTS.map((p) => ({
      id: p.id,
      commonName: p.plant.commonName,
      scientificName: p.plant.scientificName,
    }));
  };

  /* passport for a plant that is not in the register: only what the
     identification actually knows; everything else stays empty ("—") */
  function dynamicRecord(q) {
    const sci = q.get("sci") || "";
    const name = q.get("name") || sci || "Unknown plant";
    const hi = q.get("hi") || "";
    let h = 0;
    for (const c of sci + name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const now = new Date();
    return withImages({
      id: "TKP-AI-" + String(h % 100000).padStart(5, "0"),
      plant: {
        commonName: name,
        scientificName: sci,
        family: "",
        localNames: hi,
      },
      region: "",
      origin: { main: "Origin", sub: "not yet recorded" },
      coords: "",
      source: "AI photo identification",
      community: "",
      year: String(now.getFullYear()),
      issued: now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: "AI identified",
      contributor: { name: "", community: "" },
      knowledge: {
        use: "No community knowledge has been documented for this plant yet.",
        method: "",
        part: "",
        context: "",
      },
    });
  }

  /* passport.js: record for the page's query string */
  window.TKP_getRecord = function (search) {
    const q =
      search instanceof URLSearchParams
        ? search
        : new URLSearchParams(search || "");
    const id = (q.get("id") || "").toUpperCase();
    const hit = PASSPORTS.find((p) => p.id === id);
    if (hit) return withImages(hit);
    if (q.get("sci") || q.get("name")) return dynamicRecord(q);
    return withImages(PASSPORTS[0]);
  };
})();
