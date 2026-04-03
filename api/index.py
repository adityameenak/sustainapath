"""
Vercel serverless entry point for SustainaPath FastAPI backend.
Mangum wraps the ASGI app for Lambda/serverless compatibility.
"""
import sys
import os

# Add backend/ to sys.path so that "from app.xxx import yyy" works in all
# backend modules (they all use app-rooted absolute imports, e.g. "from app.api.routes import chat")
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend_dir = os.path.join(_project_root, "backend")
sys.path.insert(0, _backend_dir)

from mangum import Mangum
from app.main import app  # app.main == backend/app/main.py

# Vercel invokes this handler
handler = Mangum(app, lifespan="off")
