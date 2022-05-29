from app import app
import webbrowser
from threading import Timer

PORT = 5000

if __name__ == '__main__':
    Timer(1, lambda: webbrowser.open(f"http://127.0.0.1:{PORT}")).start()
    app.run(port=PORT)
    