import requests
from config import PLANTNET_API_KEY


PLANTNET_URL = "https://my-api.plantnet.org/v2/identify/all"


def identify_plant(image_path):
    if not PLANTNET_API_KEY:
        raise ValueError("PLANTNET_API_KEY is missing from .env")

    with open(image_path, "rb") as image:
        files = {
            "images": image
        }

        data = {
            "organs": "leaf"
        }

        params = {
            "api-key": PLANTNET_API_KEY
        }

        response = requests.post(
            PLANTNET_URL,
            params=params,
            files=files,
            data=data,
            timeout=60
        )

    response.raise_for_status()

    return response.json()