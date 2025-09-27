# server.py
"""
Main server entry-point. Registers blueprints and runs Flask.
It tries to import a recipe_extractor blueprint if present (filename recipe_extractor.py or recipe-extractor.py)
so your previous extractor file can be kept and will be mounted automatically if it exposes `extractor_bp`.
"""

import os
from flask import Flask
from flask_cors import CORS
import logging

# import our home blueprint
from home import home_bp

app = Flask(__name__)
CORS(app, origins="*")

# register home blueprint
app.register_blueprint(home_bp)

# Try to import recipe_extractor blueprint under a couple of possible module names
possible_names = ["recipe_extractor", "recipe-extractor", "recipe_extractor.py", "recipe_extractor"]
found = False
for mod_name in ["recipe_extractor", "recipe_extractor"]:
    try:
        mod = __import__(mod_name)
        if hasattr(mod, "extractor_bp"):
            app.register_blueprint(mod.extractor_bp)
            print(f"Registered extractor blueprint from module: {mod_name}")
            found = True
            break
    except Exception as e:
        # ignore import errors, just continue
        pass

if not found:
    print("No external extractor blueprint found (recipe_extractor.py). Only 'home' endpoints are available.")

if __name__ == "__main__":
    # configure logging
    logging.basicConfig(level=logging.INFO)
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask server on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
