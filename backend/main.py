from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import requests
import shutil
import tempfile

from recognition import recognize_plant


# Project layout:
#   van-vaidya/
#     backend/   <- this file, recognition.py, plantnet.py, ...
#     data/plants.json
#     frontend/index.html
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


app = FastAPI(
    title="Van Vaidya AI",
    description="Plant recognition API for Van Vaidya",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"message": "Van Vaidya AI is running"}


# Plain `def` (not `async def`): FastAPI runs it in a worker thread, so the
# blocking Pl@ntNet / Wikipedia requests don't freeze the whole server.
@app.post("/identify")
def identify(file: UploadFile = File(...)):

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    # Save to the OS temp folder, NOT the project folder. Writing files inside
    # the project makes Live Server (and some reloaders) refresh the page
    # mid-request, which throws the result away. The random name also means we
    # never trust the client's filename.
    tmp = tempfile.NamedTemporaryFile(
        delete=False, suffix=ALLOWED_TYPES[file.content_type]
    )
    file_path = Path(tmp.name)

    try:
        with tmp as buffer:
            shutil.copyfileobj(file.file, buffer)

        if file_path.stat().st_size > MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Image is too large. Please keep it under 10 MB."
            )

        return recognize_plant(str(file_path))

    except HTTPException:
        raise

    except requests.HTTPError as e:
        # Pl@ntNet answers 404 when it finds no plant in the photo.
        if e.response is not None and e.response.status_code == 404:
            return {
                "success": False,
                "message": "Pl@ntNet could not find a plant in this photo."
            }
        raise HTTPException(status_code=502, detail=f"Pl@ntNet error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # The image is only needed for this one request.
        file_path.unlink(missing_ok=True)


# Serve the frontend at http://localhost:8000/ (mounted last so API routes win).
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")