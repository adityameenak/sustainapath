from app.models import models
from app.models.database import engine  # ✅ This is likely the correct path

print("Creating database tables...")
models.Base.metadata.create_all(bind=engine)
print("✅ Done.")
