from plantnet import identify_plant
from wikipedia import get_wikipedia_info
from names import get_plant_names

import json
import re
from pathlib import Path


# ==========================================
# Load plant dataset
# ==========================================

DATASET_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "plants.json"
)

with open(DATASET_PATH, "r", encoding="utf-8") as file:
    PLANT_DATA = json.load(file)

DEVANAGARI = re.compile(r"[\u0900-\u097F]")


# ==========================================
# Find plant in our dataset
# ==========================================
# Matches the scientific name first, then any "aliases" listed for a plant
# (synonyms Pl@ntNet may return, e.g. Aloe officinalis -> Aloe vera).

def _normalize(name):
    return name.lower().strip()


PLANT_INDEX = {}

for plant in PLANT_DATA:
    PLANT_INDEX.setdefault(_normalize(plant["scientific_name"]), plant)

for plant in PLANT_DATA:
    for alias in plant.get("aliases", []):
        PLANT_INDEX.setdefault(_normalize(alias), plant)


def find_plant_in_dataset(scientific_name):
    return PLANT_INDEX.get(_normalize(scientific_name))


# ==========================================
# Plant recognition
# ==========================================

def recognize_plant(image_path):

    result = identify_plant(image_path)

    results = result.get("results", [])

    if not results:
        return {
            "success": False,
            "message": "No plant could be identified."
        }

    matches = []

    for item in results[:5]:

        species = item.get("species", {})

        scientific_name = species.get(
            "scientificNameWithoutAuthor",
            "Unknown"
        )

        confidence = round(
            item.get("score", 0) * 100,
            2
        )

        # Only accept 50% or higher
        if confidence < 50:
            continue

        # 1) Names from our controlled dataset (best quality)
        plant_data = find_plant_in_dataset(scientific_name)

        english_name = None
        hindi_name = None

        if plant_data:
            english_name = plant_data.get("english_name")
            hindi_name = plant_data.get("hindi_name")

        # 2) Wikipedia information
        wikipedia = get_wikipedia_info(scientific_name)

        # 3) Hindi name missing? The Hindi Wikipedia article title is
        #    usually the plant's Hindi name (only accept Devanagari text).
        if not hindi_name:
            hindi_title = (wikipedia.get("hindi") or {}).get("title")

            if hindi_title and DEVANAGARI.search(hindi_title):
                hindi_name = hindi_title

        # 4) Still missing a name? Ask GBIF (also checks the accepted
        #    name when Pl@ntNet returns a synonym).
        if not hindi_name or not english_name:
            gbif = get_plant_names(scientific_name)

            english_name = english_name or gbif.get("english")
            hindi_name = hindi_name or gbif.get("hindi")

        matches.append({
            "scientific_name": scientific_name,
            "english_name": english_name,
            "hindi_name": hindi_name,
            "confidence": confidence,
            "wikipedia": wikipedia
        })

    if not matches:
        return {
            "success": False,
            "message": "No reliable plant identification found.",
            "minimum_confidence": 50
        }

    return {
        "success": True,
        "matches": matches
    }