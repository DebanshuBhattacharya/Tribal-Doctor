/* Scan Medicine + Herb Interaction Checker (plain JS, no dependencies).
   Talks to the FastAPI endpoints under /medicine. All text from the server
   is inserted with textContent, never innerHTML. */
(function () {
  "use strict";

  // Same convention as the Identify feature: backend on localhost:8000.
  const API = location.port === "8000" ? "" : "http://localhost:8000";
  const TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_BYTES = 10 * 1024 * 1024;
  const RISK_LABEL = { low: "Low risk", moderate: "Moderate risk", high: "High risk" };
  const DISCLAIMER = "Educational only. Not medical advice. Consult your doctor or pharmacist.";

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- Shared navbar behaviour (same classes as script.js) ---------- */
  (function nav() {
    const navbar = $("navbar"), btn = $("hamburger"), menu = $("mobileMenu");
    let last = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (!navbar) return;
      if (y <= 40) navbar.classList.remove("scrolled", "nav-hidden");
      else {
        navbar.classList.add("scrolled");
        if (y > last && y > 100) navbar.classList.add("nav-hidden");
        else if (y < last) navbar.classList.remove("nav-hidden");
      }
      last = y;
    }, { passive: true });
    if (!btn || !menu) return;
    const set = (open) => {
      menu.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };
    btn.addEventListener("click", () => set(!menu.classList.contains("open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  })();

  /* ---------- State ---------- */
  let meds = []; // { uid, brand, generic, strength, form, confirmed, source }
  let uid = 0;
  let lastSummary = "";
  let previewUrl = null;

  /* ---------- Notices ---------- */
  function notice(id, message, actions, info) {
    const box = $(id);
    box.replaceChildren();
    if (!message) { box.hidden = true; return; }
    box.className = "sm-notice" + (info ? " is-info" : "");
    box.appendChild(el("p", null, message));
    if (actions && actions.length) {
      const row = el("div", "sm-btns");
      actions.forEach(([label, fn, primary]) => {
        const b = el("button", "btn " + (primary ? "btn-primary" : "btn-outline"));
        b.type = "button";
        b.appendChild(el("span", null, label));
        b.addEventListener("click", fn);
        row.appendChild(b);
      });
      box.appendChild(row);
    }
    box.hidden = false;
  }

  async function api(path, opts) {
    let res;
    try { res = await fetch(API + path, opts); }
    catch (e) { const err = new Error("network"); err.kind = "network"; throw err; }
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON body */ }
    if (!res.ok) {
      const err = new Error((data && (typeof data.detail === "string" ? data.detail : "")) || "Request failed.");
      err.kind = "http"; err.status = res.status; throw err;
    }
    return data;
  }

  /* ---------- Medicine list ---------- */
  function addMed(m, source) {
    meds.push({ uid: ++uid, brand: m.brand || "", generic: m.generic || "", strength: m.strength || "", form: m.form || "", confirmed: false, source: source || "manual" });
    renderList();
  }

  function renderList() {
    const list = $("medList");
    list.replaceChildren();
    $("emptyList").hidden = meds.length > 0;
    meds.forEach((m) => {
      const li = el("li", "sm-item" + (m.confirmed ? " is-confirmed" : ""));
      const fields = el("div", "sm-item-fields");
      [["brand", "Brand name"], ["generic", "Generic / active ingredient"], ["strength", "Strength"], ["form", "Dosage form"]].forEach(([key, label]) => {
        const wrap = el("label", null, label);
        const input = document.createElement("input");
        input.type = "text"; input.value = m[key]; input.maxLength = key === "generic" ? 120 : 80;
        input.addEventListener("input", () => {
          m[key] = input.value;
          if (m.confirmed) { m.confirmed = false; li.classList.remove("is-confirmed"); setConfirmLabel(); }
          updateCheck();
        });
        wrap.appendChild(input);
        fields.appendChild(wrap);
      });
      const bar = el("div", "sm-item-bar");
      const note = el("span", "sm-source", m.source === "ocr" ? "Read from your photo. Please check carefully." : m.source === "search" ? "Chosen from search. You can edit any field." : "Entered by you.");
      const confirm = el("button", "btn btn-outline sm-confirm"); confirm.type = "button";
      const label = el("span");
      confirm.appendChild(label);
      const setConfirmLabel = () => { label.textContent = m.confirmed ? "Confirmed" : "Confirm this medicine"; confirm.setAttribute("aria-pressed", String(m.confirmed)); };
      setConfirmLabel();
      confirm.addEventListener("click", () => {
        if (!m.confirmed && !(m.brand.trim() || m.generic.trim())) { notice("checkNotice", "Enter a brand or generic name before confirming."); return; }
        m.confirmed = !m.confirmed;
        li.classList.toggle("is-confirmed", m.confirmed);
        setConfirmLabel(); updateCheck();
      });
      const remove = el("button", "sm-remove", "Remove"); remove.type = "button";
      remove.setAttribute("aria-label", "Remove " + (m.brand || m.generic || "medicine"));
      remove.addEventListener("click", () => { meds = meds.filter((x) => x.uid !== m.uid); renderList(); });
      bar.append(note, confirm, remove);
      li.append(fields, bar);
      list.appendChild(li);
    });
    updateCheck();
  }

  function updateCheck() {
    const n = meds.filter((m) => m.confirmed).length;
    $("checkBtn").disabled = n === 0;
    $("checkNote").textContent = n === 0 ? "Confirm at least one medicine to continue." :
      n + " confirmed" + (meds.length > n ? ". Unconfirmed medicines are left out." : ".");
    if (n > 0) notice("checkNotice", "");
  }

  /* ---------- Step 1a: photo + OCR ---------- */
  const drop = $("dropZone");
  $("cameraBtn").addEventListener("click", () => $("cameraInput").click());
  $("galleryBtn").addEventListener("click", () => $("galleryInput").click());
  ["cameraInput", "galleryInput"].forEach((id) => $(id).addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) handleFile(f); }));
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
  drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });

  const REASONS = {
    blurry: "This photo looks blurry. Hold the camera steady, move closer and make sure the label is well lit.",
    unreadable: "We could not read any text in this photo. Try better light, hold the camera steady and fill the frame with the label.",
    not_medicine: "This does not look like a medicine label. Photograph the strip, box or prescription so the printed name is visible.",
    no_medicine_found: "We could read some text, but not a medicine name we have in our catalog. Search for your medicine instead.",
  };

  let lastFile = null;
  async function handleFile(file) {
    notice("photoNotice", "");
    if (!TYPES.includes(file.type)) { notice("photoNotice", "Please choose a JPG, PNG or WEBP image.", [["Choose another photo", () => $("galleryInput").click(), true]]); return; }
    if (file.size > MAX_BYTES) { notice("photoNotice", "This image is larger than 10 MB. Please choose a smaller photo.", [["Choose another photo", () => $("galleryInput").click(), true]]); return; }
    lastFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    const img = $("preview");
    img.src = previewUrl; img.alt = "Preview of your uploaded medicine photo"; img.hidden = false;
    $("dropIdle").hidden = true; $("busy").hidden = false;
    try {
      const fd = new FormData(); fd.append("file", file);
      const data = await api("/medicine/ocr", { method: "POST", body: fd });
      if (data.success && data.candidates.length) {
        data.candidates.forEach((c) => addMed(c, "ocr"));
        notice("photoNotice", "We found " + data.candidates.length + " possible medicine" + (data.candidates.length > 1 ? "s" : "") + " in your photo. Check the details below and confirm each one. " + (data.processed || ""), [["Use a different photo", () => $("cameraInput").click()]], true);
        $("medList").scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        const msg = REASONS[data.reason] || REASONS.unreadable;
        if (data.hint && (data.hint.strength || data.hint.form)) addMed({ strength: data.hint.strength, form: data.hint.form }, "ocr");
        notice("photoNotice", msg, [["Try another photo", () => $("cameraInput").click(), true], ["Search manually", () => $("searchInput").focus()]]);
      }
    } catch (e) {
      $("preview").hidden = true; $("dropIdle").hidden = false; // back to the upload buttons
      const msg = e.kind === "network" ? "We could not reach the server. Check that the Tribal Doctor backend is running and your connection works." : e.message;
      notice("photoNotice", msg, [["Retry", () => lastFile && handleFile(lastFile), true], ["Search manually", () => $("searchInput").focus()]]);
    } finally {
      $("busy").hidden = true; // the preview stays visible; it only lives in this tab
    }
  }

  /* ---------- Step 1b: autocomplete search ---------- */
  const input = $("searchInput"), box = $("suggestions");
  let timer = null, reqId = 0, items = [], active = -1;

  const closeBox = () => { box.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  function setActive(i) {
    active = i;
    [...box.children].forEach((li, k) => li.setAttribute("aria-selected", String(k === i)));
    if (i >= 0) input.setAttribute("aria-activedescendant", box.children[i].id); else input.removeAttribute("aria-activedescendant");
  }
  function choose(i) {
    const it = items[i];
    if (!it) return;
    if (it.manual) addMed({ generic: it.text }, "manual");
    else addMed({ brand: it.data.brand, generic: it.data.generic, strength: it.data.strengths[0] || "", form: it.data.forms[0] || "" }, "search");
    input.value = ""; closeBox(); notice("searchNotice", "");
  }
  function renderBox(q) {
    box.replaceChildren();
    items.forEach((it, i) => {
      const li = el("li", it.manual ? "sm-manual" : "");
      li.id = "sg" + i; li.setAttribute("role", "option");
      if (it.manual) li.textContent = "Add \u201C" + it.text + "\u201D as I typed it";
      else {
        li.appendChild(el("span", null, it.data.matched));
        li.appendChild(el("small", null, it.data.matched_type === "brand" ? "brand of " + it.data.generic : "generic"));
      }
      li.addEventListener("mousedown", (e) => { e.preventDefault(); choose(i); });
      box.appendChild(li);
    });
    box.hidden = false; input.setAttribute("aria-expanded", "true"); setActive(-1);
  }
  async function runSearch(q) {
    const my = ++reqId;
    try {
      const data = await api("/medicine/search?q=" + encodeURIComponent(q));
      if (my !== reqId) return; // a newer query is in flight
      items = data.results.map((r) => ({ data: r }));
      items.push({ manual: true, text: q });
      notice("searchNotice", data.results.length ? "" : "No match in our catalog. You can add it as typed, but we can only check medicines we hold records for.", null, true);
      renderBox(q);
    } catch (e) {
      if (my !== reqId) return;
      closeBox();
      notice("searchNotice", e.kind === "network" ? "Search needs the Tribal Doctor backend. Check that it is running." : e.message, [["Retry", () => runSearch(q), true]]);
    }
  }
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { reqId++; closeBox(); notice("searchNotice", ""); return; }
    timer = setTimeout(() => runSearch(q), 200);
  });
  input.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + items.length) % items.length); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === "Escape") closeBox();
  });
  input.addEventListener("blur", closeBox);

  /* ---------- Step 4/5: interactions ---------- */
  $("checkBtn").addEventListener("click", runCheck);

  async function runCheck() {
    const confirmed = meds.filter((m) => m.confirmed);
    if (!confirmed.length) return;
    const btn = $("checkBtn");
    btn.disabled = true; btn.classList.add("is-loading");
    notice("checkNotice", "");
    try {
      const data = await api("/medicine/interactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines: confirmed.map(({ brand, generic, strength, form }) => ({ brand, generic, strength, form })) }),
      });
      renderResults(data);
    } catch (e) {
      const msg = e.kind === "network" ? "We could not reach the interaction database. Check that the backend is running and try again. Nothing has been checked." :
        e.status === 422 ? "Some medicine details are not valid. Check the fields and try again." : e.message;
      notice("checkNotice", msg, [["Try again", runCheck, true]]);
    } finally {
      btn.classList.remove("is-loading"); updateCheck();
    }
  }

  function renderResults(data) {
    const body = $("resultsBody");
    body.replaceChildren();
    const lines = ["Tribal Doctor: medicine and herb interaction summary", DISCLAIMER, ""];

    data.results.forEach((r) => {
      const g = el("div", "sm-group");
      const h = el("h3", null, r.medicine);
      g.appendChild(h);
      lines.push(r.medicine);

      if (r.status === "not_checked") {
        const n = el("div", "sm-none is-warn");
        n.append(el("strong", null, "We could not check this medicine."), el("span", null, "It is not in our medicine catalog, so we have no records for it. This does not mean there is no interaction. Ask your pharmacist."));
        g.appendChild(n);
        lines.push("  Not checked: medicine not in our catalog.");
      } else if (r.status === "no_known_interaction") {
        const n = el("div", "sm-none");
        n.append(el("strong", null, "No known interaction in our database."), el("span", null, "This only reflects the records we hold. Ask your pharmacist about any herb you plan to take."));
        g.appendChild(n);
        lines.push("  No known interaction in our database.");
      }
      if (r.partially_checked) {
        g.appendChild(el("div", "sm-none is-warn", "Part of this combination product (" + r.unresolved.join(", ") + ") is not in our catalog and was not checked."));
        lines.push("  Not checked: " + r.unresolved.join(", "));
      }
      r.interactions.forEach((ix) => {
        g.appendChild(interactionRow(ix));
        lines.push("  " + RISK_LABEL[ix.risk_level] + ": " + ix.herb.common_names[0] + " (" + ix.herb.scientific_name + ")", "    " + ix.plain_explanation, "    Evidence: " + ix.evidence_quality, "    Sources: " + ix.sources.map((s) => s.url).join(" ; "));
      });
      lines.push("");
      body.appendChild(g);
    });

    const d = data.dataset || {};
    $("datasetNote").textContent = "Results come only from " + (d.interaction_records || 0) + " curated, referenced records" + (d.last_reviewed ? " (last reviewed " + d.last_reviewed + ")" : "") + ". No AI was used to create warnings. A missing result is not a guarantee.";
    lines.push("Checked against " + (d.interaction_records || 0) + " curated records. A missing result is not a guarantee.", DISCLAIMER);
    lastSummary = lines.join("\n");
    notice("actionNotice", "");
    const sec = $("results"); sec.hidden = false; sec.focus({ preventScroll: true });
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function interactionRow(ix) {
    const row = el("article", "sm-ix risk-" + ix.risk_level);
    const name = ix.herb.common_names[0];
    let thumb;
    if (ix.herb.image) { thumb = document.createElement("img"); thumb.className = "sm-thumb"; thumb.src = ix.herb.image; thumb.alt = name; thumb.loading = "lazy"; thumb.addEventListener("error", () => { const t = el("div", "sm-thumb", name[0]); t.setAttribute("aria-hidden", "true"); thumb.replaceWith(t); }); }
    else { thumb = el("div", "sm-thumb", name[0]); thumb.setAttribute("aria-hidden", "true"); }

    const main = el("div");
    const top = el("div", "sm-ix-top");
    top.append(el("h4", null, name), el("span", "sm-latin", ix.herb.scientific_name), el("span", "sm-badge", RISK_LABEL[ix.risk_level]));
    main.append(top, el("p", null, ix.plain_explanation), el("p", "sm-evidence", "Evidence: " + ix.evidence_quality));
    if (ix.review_status === "pending_clinical_review") main.appendChild(el("span", "sm-tag", "Awaiting pharmacist or clinician review"));
    main.appendChild(document.createElement("br"));
    if (ix.herb.page_url) { const a = el("a", "sm-link", "View " + name + " on Tribal Doctor"); a.href = ix.herb.page_url; main.appendChild(a); }
    else main.appendChild(el("span", "sm-tag", name + " is not listed on Tribal Doctor."));

    const det = el("details");
    det.appendChild(el("summary", null, "Scientific details and sources"));
    const dl = el("dl");
    dl.append(el("dt", null, "How it may work"), el("dd", null, ix.mechanism), el("dt", null, "Last reviewed"), el("dd", null, ix.last_reviewed), el("dt", null, "Sources"));
    const ul = el("ul");
    ix.sources.forEach((s) => { const li = el("li"); const a = el("a", null, s.title); a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer"; li.appendChild(a); ul.appendChild(li); });
    det.append(dl, ul);
    main.appendChild(det);
    row.append(thumb, main);
    return row;
  }

  /* ---------- Save / share (nothing is stored unless the user acts) ---------- */
  $("saveBtn").addEventListener("click", () => {
    if (!lastSummary) return;
    const url = URL.createObjectURL(new Blob([lastSummary], { type: "text/plain;charset=utf-8" }));
    const a = el("a"); a.href = url; a.download = "tribal-doctor-medicine-summary.txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice("actionNotice", "Summary saved to your device as a text file.", null, true);
  });
  $("shareBtn").addEventListener("click", async () => {
    if (!lastSummary) return;
    try {
      if (navigator.share) { await navigator.share({ title: "Medicine and herb interaction summary", text: lastSummary }); return; }
      await navigator.clipboard.writeText(lastSummary);
      notice("actionNotice", "Summary copied. You can paste it into a message or email.", null, true);
    } catch (e) {
      if (e && e.name === "AbortError") return; // user closed the share sheet
      notice("actionNotice", "Sharing is not available here. Use Save summary instead.");
    }
  });

  renderList();
})();