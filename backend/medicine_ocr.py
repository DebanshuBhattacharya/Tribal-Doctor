"""Local OCR for medicine strips/boxes using Tesseract.

The image is processed in memory and never written to disk. Nothing is sent to
a third-party service. Only names found in our own catalog are proposed, so a
misread word can never turn into a different medicine on its own.
"""
import io
import re
from difflib import SequenceMatcher

from PIL import Image, ImageOps, ImageFilter, UnidentifiedImageError

import medicine_data as md

try:
    import pytesseract
except ImportError:  # reported as an OCR-unavailable error, never faked
    pytesseract = None

Image.MAX_IMAGE_PIXELS = 40_000_000  # decompression-bomb guard

STRENGTH_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ug|g|ml|iu)\b", re.I)
FORMS = [
    ("Extended-release tablet", r"\b(extended[- ]release|prolonged[- ]release|\bXR\b|\bER\b|\bSR\b)\b"),
    ("Tablet", r"\btablets?\b|\btab\b"),
    ("Capsule", r"\bcapsules?\b|\bcaps?\b"),
    ("Syrup", r"\bsyrup\b|\bsuspension\b"),
    ("Injection", r"\binjection\b|\binj\b"),
]


class OCRUnavailable(Exception):
    pass


class UnreadableImage(Exception):
    pass


def available():
    if pytesseract is None:
        return False
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def _prepare(data):
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError):
        raise UnreadableImage("not_an_image")
    img = ImageOps.exif_transpose(img).convert("L")
    if max(img.size) > 2200:
        img.thumbnail((2200, 2200))
    elif max(img.size) < 900:
        scale = 900 / max(img.size)
        img = img.resize((int(img.width * scale), int(img.height * scale)))
    return ImageOps.autocontrast(img)


def _sharpness(img):
    edges = img.filter(ImageFilter.FIND_EDGES)
    hist = edges.histogram()
    total = sum(hist) or 1
    mean = sum(i * c for i, c in enumerate(hist)) / total
    return sum(c * (i - mean) ** 2 for i, c in enumerate(hist)) / total


def _read(img):
    d = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config="--psm 11")
    words, confs = [], []
    for t, c in zip(d["text"], d["conf"]):
        t = (t or "").strip()
        try:
            c = float(c)
        except (TypeError, ValueError):
            continue
        if t and c >= 0:
            words.append(t)
            confs.append(c)
    return words, (sum(confs) / len(confs) if confs else 0.0)


def _match_names(words):
    """Match OCR words against catalog names. Exact match scores 1.0; a close
    fuzzy match (>=0.88, same first letter) is accepted for single OCR typos."""
    found = {}
    for w in words:
        n = md.norm(w)
        if len(n) < 4:
            continue
        for name, drug_id in md.NAME_INDEX.items():
            if " " in name:
                continue
            score = 1.0 if n == name else SequenceMatcher(None, n, name).ratio()
            if score >= 0.88 and n[0] == name[0]:
                if drug_id not in found or score > found[drug_id][0]:
                    found[drug_id] = (score, name)
    return found


def scan(data):
    if not available():
        raise OCRUnavailable()
    img = _prepare(data)
    sharp = _sharpness(img)
    words, conf = _read(img)
    text = " ".join(words)

    if len(text) < 6 or conf < 35:
        reason = "blurry" if sharp < 60 else "unreadable"
        return {"success": False, "reason": reason, "candidates": []}

    matches = _match_names(words)
    strengths = [f"{a} {u.lower()}" for a, u in STRENGTH_RE.findall(text)]
    form = next((label for label, rx in FORMS if re.search(rx, text, re.I)), "")

    candidates = []
    for drug_id, (score, matched_name) in sorted(matches.items(), key=lambda x: -x[1][0]):
        drug = md.DRUGS[drug_id]
        is_brand = matched_name != md.norm(drug["generic"])
        brand = next((b for b in drug["brands"] if md.norm(b) == matched_name), "")
        candidates.append({
            "brand": brand if is_brand else "",
            "generic": drug["generic"],
            "strength": strengths[0] if strengths else "",
            "form": form,
            "match_confidence": round(score * min(conf, 100) / 100, 2),
        })

    if not candidates:
        reason = "no_medicine_found" if (strengths or form) else "not_medicine"
        return {"success": False, "reason": reason, "candidates": [],
                "hint": {"strength": strengths[0] if strengths else "", "form": form}}
    return {"success": True, "candidates": candidates}