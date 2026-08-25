import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

site_pkg_path = r"D:\Lib\site-packages"
if os.path.exists(site_pkg_path) and site_pkg_path not in sys.path:
    sys.path.insert(0, site_pkg_path)

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Razorpay Agentic Commerce Gateway")
    print("   Pitch-Black Glassmorphic UI & Bounded Checkout Agent")
    print("   Listening at: http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
