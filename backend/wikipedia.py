import requests
from urllib.parse import quote


def get_wikipedia_info(scientific_name):
    """
    Get English and Hindi Wikipedia information
    using the scientific name.
    """

    result = {
        "english": None,
        "hindi": None
    }

    # -------------------------
    # English Wikipedia
    # -------------------------
    try:
        english_url = (
            "https://en.wikipedia.org/api/rest_v1/page/summary/"
            + quote(scientific_name.replace(" ", "_"))
        )

        response = requests.get(
            english_url,
            timeout=10,
            headers={
                "User-Agent": "VanVaidya/1.0"
            }
        )

        if response.status_code == 200:
            data = response.json()

            result["english"] = {
                "title": data.get("title"),
                "description": data.get("description"),
                "extract": data.get("extract"),
                "url": data.get("content_urls", {})
                    .get("desktop", {})
                    .get("page")
            }

    except requests.RequestException:
        pass


    # -------------------------
    # Hindi Wikipedia
    # -------------------------
    try:
        hindi_url = (
            "https://hi.wikipedia.org/api/rest_v1/page/summary/"
            + quote(scientific_name.replace(" ", "_"))
        )

        response = requests.get(
            hindi_url,
            timeout=10,
            headers={
                "User-Agent": "VanVaidya/1.0"
            }
        )

        if response.status_code == 200:
            data = response.json()

            result["hindi"] = {
                "title": data.get("title"),
                "description": data.get("description"),
                "extract": data.get("extract"),
                "url": data.get("content_urls", {})
                    .get("desktop", {})
                    .get("page")
            }

    except requests.RequestException:
        pass


    return result