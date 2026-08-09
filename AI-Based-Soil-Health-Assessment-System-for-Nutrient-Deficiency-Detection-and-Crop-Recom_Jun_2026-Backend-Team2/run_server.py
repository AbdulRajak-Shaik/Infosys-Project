"""Start the FastAPI server with the upgraded TensorFlow and Keras."""

import os
import socket
import sys

# Ensure the app module can be imported
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "8000"))

    # Avoid loading TensorFlow and starting a second server when this port is
    # already serving the backend.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(1)
        if probe.connect_ex((host, port)) == 0:
            print(
                f"[!] Server is already running at http://{host}:{port}. "
                "Stop the existing process before starting another instance."
            )
            sys.exit(0)

    from app.main import app
    import uvicorn

    print(f"[+] Starting FastAPI server with TensorFlow and Keras at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
