# server.py
"""
server.py

Top-level Flask app. Imports local modules and registers any blueprints (attributes ending with `_bp`)
or calls `init_app(app)` when available.

Start the full backend with:
    python server.py
"""
import importlib
import pkgutil
import os
from flask import Flask, jsonify
from flask_cors import CORS

# Modules to try to import (use underscores for filenames)
AUTO_MODULES = [
    "recipe_extractor",
    "home",
    "chatbot",
    "custom_recipe",
    "fridge",
    "my_recipes",
    "nutrition_extractor",
    "onboarding",
    "profile",
    "recipe_detail",
    "diet_plan",
    # add other module names here as needed
]

app = Flask(__name__)
CORS(app)  # apply CORS globally

registered = []

def try_register_module(name: str):
    try:
        mod = importlib.import_module(name)
    except Exception as e:
        print(f"[server] could not import module '{name}': {e}")
        return

    # 1) register any attribute that ends with _bp and looks like a Flask blueprint
    for attr in dir(mod):
        if attr.endswith("_bp"):
            bp = getattr(mod, attr)
            try:
                app.register_blueprint(bp)
                registered.append(f"{name}.{attr}")
                print(f"[server] registered blueprint {name}.{attr}")
            except Exception as e:
                print(f"[server] failed to register blueprint {name}.{attr}: {e}")

    # 2) register common blueprint names if present
    for common in ("bp", "blueprint", "home_bp", "extractor_bp", "diet_bp"):
        if hasattr(mod, common):
            try:
                app.register_blueprint(getattr(mod, common))
                registered.append(f"{name}.{common}")
                print(f"[server] registered blueprint {name}.{common}")
            except Exception as e:
                print(f"[server] failed to register {name}.{common}: {e}")

    # 3) call init_app(app) if present
    if hasattr(mod, "init_app"):
        try:
            mod.init_app(app)
            registered.append(f"{name}.init_app")
            print(f"[server] called init_app on {name}")
        except Exception as e:
            print(f"[server] init_app failed for {name}: {e}")

# Try to register modules listed in AUTO_MODULES
for m in AUTO_MODULES:
    try_register_module(m)

# Optionally autodiscover other local modules in the current directory (helpful if you add modules later)
for finder, modname, ispkg in pkgutil.iter_modules([os.getcwd()]):
    # avoid re-importing server itself
    if modname in ("server",):
        continue
    # If the module was explicitly listed and already imported above, skip
    if modname in AUTO_MODULES:
        continue
    # try to register the module
    try_register_module(modname)

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "success": True,
        "message": "Backend running",
        "registered": registered
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "1") == "1")
