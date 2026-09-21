import re
import requests


GBIF_MATCH_URL = "https://api.gbif.org/v1/species/match"
GBIF_VERNACULAR_URL = "https://api.gbif.org/v1/species/{key}/vernacularNames"

DEVANAGARI = re.compile(r"[\u0900-\u097F]")


def get_plant_names(scientific_name):
    """
    Match a scientific name in GBIF and return English / Hindi common names.

    Also checks the accepted name when the given name is a synonym
    (e.g. Pl@ntNet says "Aloe barbadensis", GBIF's accepted name is "Aloe vera").
    Only Devanagari names are used for the Hindi slot; Latin-script
    transliterations go to other_names.
    """

    empty = {"english": None, "hindi": None, "other_names": []}

    try:
        match_response = requests.get(
            GBIF_MATCH_URL,
            params={"name": scientific_name},
            timeout=10
        )
        match_response.raise_for_status()
        match_data = match_response.json()

        keys = []
        for key in (match_data.get("usageKey"), match_data.get("acceptedUsageKey")):
            if key and key not in keys:
                keys.append(key)

        if not keys:
            return empty

        english = None
        hindi = None
        other_names = []

        for key in keys:
            names_response = requests.get(
                GBIF_VERNACULAR_URL.format(key=key),
                params={"limit": 200},
                timeout=10
            )
            names_response.raise_for_status()

            for item in names_response.json().get("results", []):

                name = item.get("vernacularName")
                language = (item.get("language") or "").lower()

                if not name:
                    continue

                if language in ("eng", "en"):
                    english = english or name

                elif language in ("hin", "hi") and DEVANAGARI.search(name):
                    hindi = hindi or name

                else:
                    other_names.append({
                        "name": name,
                        "language": language or "unknown"
                    })

        return {
            "english": english,
            "hindi": hindi,
            "other_names": other_names
        }

    except (requests.RequestException, ValueError):
        return empty