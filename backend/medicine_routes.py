"""Scan Medicine + Herb Interaction Checker API.

Mounted from main.py. OCR and interaction checking are separate endpoints.
"""
from typing import List

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field, field_validator

import medicine_data as md
import medicine_ocr as ocr

router = APIRouter(prefix="/medicine", tags=["medicine"])

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 10 * 1024 * 1024


class MedicineIn(BaseModel):
    brand: str = Field("", max_length=80)
    generic: str = Field("", max_length=120)
    strength: str = Field("", max_length=30)
    form: str = Field("", max_length=40)

    @field_validator("brand", "generic", "strength", "form")
    @classmethod
    def clean(cls, v):
        return " ".join((v or "").split())


class CheckIn(BaseModel):
    medicines: List[MedicineIn] = Field(..., min_length=1, max_length=15)


@router.post("/ocr")
def read_medicine(file: UploadFile = File(...)):
    """OCR only. Never checks interactions. The image stays in memory."""
    if file.content_type not in IMAGE_TYPES:
        raise HTTPException(400, "Please upload a JPG, PNG or WEBP image.")
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is too large. Please keep it under 10 MB.")
    try:
        result = ocr.scan(data)
    except ocr.OCRUnavailable:
        raise HTTPException(503, "Text reading is not available on this server. Search for your medicine instead.")
    except ocr.UnreadableImage:
        raise HTTPException(400, "This file could not be opened as an image.")
    except Exception:
        raise HTTPException(500, "Could not read this image. Try another photo or search manually.")
    result["processed"] = "On this server with Tesseract. The image is not saved and not sent to any other service."
    return result


@router.get("/search")
def search_medicines(q: str = Query(..., min_length=2, max_length=60)):
    return {"query": q, "results": md.search(q)}


@router.post("/interactions")
def check_interactions(body: CheckIn):
    return {
        "results": md.check([m.model_dump() for m in body.medicines]),
        "dataset": md.dataset_info(),
        "disclaimer": "Educational only. Not medical advice. Consult your doctor or pharmacist.",
    }


@router.get("/interactions/{interaction_id}")
def interaction_detail(interaction_id: str):
    rec = md.get_interaction(interaction_id)
    if not rec:
        raise HTTPException(404, "Interaction record not found.")
    return rec


@router.get("/sources/{source_id}")
def source_detail(source_id: str):
    src = md.SOURCES.get(source_id)
    if not src:
        raise HTTPException(404, "Source not found.")
    return src