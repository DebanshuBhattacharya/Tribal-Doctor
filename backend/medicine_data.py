"""Medicine catalog search + curated drug-herb interaction lookup.

No LLM and no inference: an interaction is only reported if a record for that
exact generic drug exists in data/drug_herb_interactions.json. Unknown drugs
are reported as `not_checked`, never as "no interaction".
"""
import json
import re
from difflib import SequenceMatcher
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(name):
    with open(DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


_med = _load("medicines.json")
_ix = _load("drug_herb_interactions.json")

DRUGS = {d["id"]: d for d in _med["drugs"]}
HERBS = {h["id"]: h for h in _ix["herbs"]}
SOURCES = {s["id"]: s for s in _ix["sources"]}
INTERACTIONS = {i["id"]: i for i in _ix["interactions"]}


def norm(text):
    return re.sub(r"[^a-z0-9 ]+", " ", (text or "").lower()).strip()


# name (brand or generic, normalised) -> drug id
NAME_INDEX = {}
for _d in DRUGS.values():
    NAME_INDEX[norm(_d["generic"])] = _d["id"]
    for _b in _d["brands"]:
        NAME_INDEX[norm(_b)] = _d["id"]


def resolve_drug_ids(generic="", brand=""):
    """Return (drug_ids, unresolved_names). Combination products such as
    'Metformin + Glimepiride' are split and each part resolved separately."""
    ids, unresolved = [], []
    parts = [p for p in re.split(r"\+|/|&|,|\band\b", generic or "", flags=re.I) if p.strip()]
    for part in parts:
        key = norm(part)
        key = re.sub(r"\b(hydrochloride|hcl|sodium|ip|bp|usp)\b", "", key).strip()
        if key in NAME_INDEX:
            ids.append(NAME_INDEX[key])
        else:
            unresolved.append(part.strip())
    if not parts and brand:
        key = norm(brand)
        if key in NAME_INDEX:
            ids.append(NAME_INDEX[key])
        else:
            unresolved.append(brand.strip())
    return list(dict.fromkeys(ids)), unresolved


def search(q, limit=8):
    q = norm(q)
    if len(q) < 2:
        return []
    scored = []
    for d in DRUGS.values():
        names = [(d["generic"], "generic")] + [(b, "brand") for b in d["brands"]]
        best = None
        for name, kind in names:
            n = norm(name)
            if n.startswith(q):
                score = 1.0
            elif q in n:
                score = 0.8
            else:
                score = SequenceMatcher(None, q, n).ratio()
                if score < 0.75:
                    continue
            if best is None or score > best[0]:
                best = (score, name, kind)
        if best:
            scored.append((best[0], d, best[1], best[2]))
    scored.sort(key=lambda x: -x[0])
    return [
        {
            "id": d["id"],
            "matched": name,
            "matched_type": kind,
            "generic": d["generic"],
            "brand": name if kind == "brand" else "",
            "brands": d["brands"],
            "strengths": d["strengths"],
            "forms": d["forms"],
        }
        for _, d, name, kind in scored[:limit]
    ]


def public_interaction(rec):
    herb = HERBS[rec["herb_id"]]
    drug = DRUGS[rec["drug_id"]]
    return {
        "id": rec["id"],
        "drug_generic": drug["generic"],
        "drug_brand_aliases": drug["brands"],
        "herb": {
            "id": herb["id"],
            "scientific_name": herb["scientific_name"],
            "common_names": herb["common_names"],
            "image": herb["image"],
            "page_url": herb["page_url"],
        },
        "risk_level": rec["risk_level"],
        "mechanism": rec["mechanism"],
        "plain_explanation": rec["plain_explanation"],
        "evidence_quality": rec["evidence_quality"],
        "sources": [SOURCES[s] for s in rec["source_ids"]],
        "last_reviewed": rec["last_reviewed"],
        "review_status": rec["review_status"],
    }


def get_interaction(interaction_id):
    rec = INTERACTIONS.get(interaction_id)
    return public_interaction(rec) if rec else None


def check(medicines):
    """medicines: list of dicts with brand/generic. Returns one result per medicine."""
    out = []
    for m in medicines:
        ids, unresolved = resolve_drug_ids(m.get("generic", ""), m.get("brand", ""))
        label = " ".join(x for x in [m.get("brand") or m.get("generic"), m.get("strength")] if x)
        hits = [public_interaction(r) for r in INTERACTIONS.values() if r["drug_id"] in ids]
        order = {"high": 0, "moderate": 1, "low": 2}
        hits.sort(key=lambda h: order[h["risk_level"]])
        if unresolved and not ids:
            status = "not_checked"  # drug not in our catalog: we cannot say anything
        elif hits:
            status = "interactions_found"
        else:
            status = "no_known_interaction"
        out.append({
            "medicine": label or "Unnamed medicine",
            "input": {k: m.get(k, "") for k in ("brand", "generic", "strength", "form")},
            "status": status,
            "unresolved": unresolved,
            "partially_checked": bool(unresolved and ids),
            "interactions": hits,
        })
    return out


def dataset_info():
    return {
        "interaction_records": len(INTERACTIONS),
        "medicines_in_catalog": len(DRUGS),
        "last_reviewed": max((i["last_reviewed"] for i in INTERACTIONS.values()), default=None),
    }