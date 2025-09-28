# server.py - Integrated server with fridge endpoints
"""
Top-level Flask app with fridge and chatbot integration
"""
import importlib
import pkgutil
import time
import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Callable
from dotenv import load_dotenv

load_dotenv()

# Modules to import
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
]

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['JSON_SORT_KEYS'] = False

registered = []

def try_register_blueprint_from_module(mod, attr_name):
    if not hasattr(mod, attr_name):
        return False
    bp = getattr(mod, attr_name)
    try:
        bp_name = getattr(bp, "name", None) or attr_name
        if bp_name in app.blueprints:
            print(f"[server] blueprint '{bp_name}' already registered; skipping.")
            return True
        app.register_blueprint(bp)
        registered.append(f"{mod.__name__}.{attr_name}")
        print(f"[server] ✅ registered blueprint {mod.__name__}.{attr_name}")
        return True
    except Exception as e:
        print(f"[server] ❌ failed to register blueprint {mod.__name__}.{attr_name}: {e}")
        return False

def try_register_module(name: str):
    try:
        mod = importlib.import_module(name)
        print(f"[server] 🔍 imported module: {name}")
    except ModuleNotFoundError as e:
        print(f"[server] ⚠️  module '{name}' not found: {e}")
        return
    except Exception as e:
        print(f"[server] ❌ error importing module '{name}': {e}")
        return

    # Register blueprints
    blueprint_registered = False
    for attr in dir(mod):
        if attr.endswith("_bp"):
            if try_register_blueprint_from_module(mod, attr):
                blueprint_registered = True

    # Register common blueprint names
    common_blueprints = ("bp", "blueprint", "home_bp", "extractor_bp", "diet_bp", "fridge_bp", "nutrition_bp", "chatbot_bp")
    for common in common_blueprints:
        if hasattr(mod, common):
            if try_register_blueprint_from_module(mod, common):
                blueprint_registered = True

    # Call init_app if present
    if hasattr(mod, "init_app"):
        try:
            mod.init_app(app)
            registered.append(f"{name}.init_app")
            print(f"[server] ✅ called init_app on {name}")
        except Exception as e:
            print(f"[server] ❌ init_app failed for {name}: {e}")

# Enhanced explicit registration for critical modules
def register_module_explicitly(module_name, blueprint_name=None):
    try:
        mod = importlib.import_module(module_name)
        print(f"[server] 🔍 explicitly importing: {module_name}")
        
        if blueprint_name and hasattr(mod, blueprint_name):
            try_register_blueprint_from_module(mod, blueprint_name)
        else:
            blueprints_to_try = [blueprint_name] if blueprint_name else []
            blueprints_to_try.extend(["bp", "blueprint", f"{module_name}_bp"])
            
            for bp_name in blueprints_to_try:
                if bp_name and hasattr(mod, bp_name):
                    if try_register_blueprint_from_module(mod, bp_name):
                        break
            else:
                try_register_module(module_name)
                
    except Exception as e:
        print(f"[server] ❌ explicit registration failed for {module_name}: {e}")

# Start initialization
print("[server] 🚀 Starting server initialization...")

# CRITICAL: Register all modules
critical_modules = [
    ("chatbot", "chatbot_bp"),
    ("fridge", "fridge_bp"),
    ("nutrition_extractor", "bp"),
    ("recipe_extractor", "extractor_bp"),
    ("home", "bp"),
]

for module_name, bp_name in critical_modules:
    register_module_explicitly(module_name, bp_name)

# Register other modules
for m in AUTO_MODULES:
    already_registered = any(reg.startswith(f"{m}.") for reg in registered)
    if not already_registered:
        print(f"[server] 🔄 auto-registering: {m}")
        try_register_module(m)
    else:
        print(f"[server] ⏩ skipping already registered: {m}")

# Fallback direct routes for all modules
def _safe_register_direct(module_name: str, func_name: str, url_rule: str, methods=("POST",)):
    try:
        mod = importlib.import_module(module_name)
    except Exception as e:
        print(f"[server] ⚠️ cannot import module {module_name} for direct route {url_rule}: {e}")
        return False

    if not hasattr(mod, func_name):
        print(f"[server] ⚠️ module {module_name} has no function {func_name} to register at {url_rule}")
        return False

    view_func = getattr(mod, func_name)
    endpoint_name = f"{module_name}.{func_name}"

    def _wrapper(*args, **kwargs):
        try:
            return view_func(*args, **kwargs)
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Error invoking {module_name}.{func_name}: {str(e)}"
            }), 500

    try:
        app.add_url_rule(url_rule, endpoint_name, _wrapper, methods=list(methods))
        registered.append(f"{module_name}.{func_name}->route:{url_rule}")
        print(f"[server] ✅ Direct route registered: {url_rule} -> {module_name}.{func_name}")
        return True
    except Exception as e:
        print(f"[server] ❌ Failed to add direct route {url_rule}: {e}")
        return False

# Fridge-specific fallback routes
fridge_fallback_routes = [
    ("fridge", "health", "/health", ("GET",)),
    ("fridge", "fridge_photo", "/fridge/photo", ("POST",)),
    ("fridge", "fridge_text", "/fridge/text", ("POST",)),
    ("fridge", "get_recipe", "/fridge/recipe/<recipe_id>", ("GET",)),
]

# Chatbot-specific fallback routes
chatbot_fallback_routes = [
    ("chatbot", "chat_message", "/api/chatbot/message", ("POST", "OPTIONS")),
    ("chatbot", "voice_message", "/api/chatbot/voice", ("POST", "OPTIONS")),
    ("chatbot", "health_check", "/api/chatbot/health", ("GET",)),
    ("chatbot", "test_chat", "/api/chatbot/test", ("POST",)),
    ("chatbot", "list_intents", "/api/chatbot/intents", ("GET",)),
]

# Register all fallback routes
for mod_name, fn_name, url, methods in fridge_fallback_routes + chatbot_fallback_routes:
    _safe_register_direct(mod_name, fn_name, url, methods)

# Health check routes
@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "success": True,
        "message": "Culinary AI Backend Running",
        "status": "healthy",
        "version": "2.0.0",
        "registered_modules": registered,
        "endpoints": {
            "fridge": [
                "POST /fridge/photo",
                "POST /fridge/text", 
                "GET /fridge/recipe/<id>"
            ],
            "chatbot": [
                "POST /api/chatbot/message",
                "POST /api/chatbot/voice", 
                "GET /api/chatbot/health"
            ]
        }
    })

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Culinary AI Server",
        "timestamp": time.time() if 'time' in globals() else None,
        "registered_modules": len(registered)
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "available_endpoints": {
            "fridge": {
                "photo_analysis": "POST /fridge/photo",
                "text_analysis": "POST /fridge/text",
                "get_recipe": "GET /fridge/recipe/<id>"
            },
            "chatbot": {
                "message": "POST /api/chatbot/message",
                "voice": "POST /api/chatbot/voice",
                "health": "GET /api/chatbot/health"
            }
        }
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == "__main__":
    cwd = os.getcwd()
    if cwd not in sys.path:
        sys.path.insert(0, cwd)

    print(f"[server] 📊 Server Summary:")
    print(f"[server] ✅ Registered modules: {len(registered)}")
    print(f"[server] ✅ Blueprints: {list(app.blueprints.keys())}")
    
    # Verify fridge routes
    fridge_routes = []
    for rule in app.url_map.iter_rules():
        if 'fridge' in rule.rule:
            fridge_routes.append({
                "path": rule.rule,
                "methods": list(rule.methods)
            })
    
    print(f"[server] 🔍 Fridge routes: {len(fridge_routes)}")
    for route in fridge_routes:
        print(f"[server]   - {route['path']} {route['methods']}")

    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"[server] 🌐 Starting server on http://{host}:{port}")
    print(f"[server] 🔗 Fridge endpoints:")
    print(f"[server]   - POST http://{host}:{port}/fridge/photo")
    print(f"[server]   - POST http://{host}:{port}/fridge/text")
    print(f"[server]   - GET  http://{host}:{port}/fridge/recipe/<id>")
    
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    
    app.run(host=host, port=port, debug=debug_mode, threaded=True)