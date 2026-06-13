import logging
logging.basicConfig(level=logging.INFO)
from fastapi.testclient import TestClient
from app.main import app
import io
from PIL import Image

with TestClient(app) as client:
    img = Image.new("RGB", (224, 224), color=(180, 100, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    bytes_data = buf.getvalue()

    r = client.post("/api/v1/predict/", files={"file": ("test.jpg", bytes_data, "image/jpeg")})
    print(r.status_code)
    print(r.text)
