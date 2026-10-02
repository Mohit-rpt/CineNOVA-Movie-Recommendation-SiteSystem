import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    is_dev = os.getenv("ENVIRONMENT", "").lower() in ("development", "dev")
    print(f"Starting CineNOVA platform at http://{host}:{port} (dev_mode={is_dev})")
    uvicorn.run("main:app", host=host, port=port, reload=is_dev)
