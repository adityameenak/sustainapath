"""
Vercel serverless entry point for SustainaPath FastAPI backend.
Mangum wraps the ASGI app for Lambda/serverless compatibility.
"""
import sys
import os

# Ensure the project root is on the path so backend imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mangum import Mangum
from backend.app.main import app

# Vercel invokes this handler
handler = Mangum(app, lifespan="off")
