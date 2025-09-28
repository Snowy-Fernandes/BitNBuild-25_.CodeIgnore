# server.py
"""
Top-level Flask app. Imports local modules and registers any blueprints (attributes ending with `_bp`)
or calls `init_app(app)` when available.

Start the full backend with:
    python server.py
"""
import importlib
import pkgutil
import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Callable

# Modules to try to import (use underscores for filenames)
AUTO_MODULES = [
    "recipe_extractor",
    "home",
    "chatbot",
    "custom_recipe",
    "fridge",
    "my_recipes",
    "nutrition_extractor",   # Nutrition extractor module
    "onboarding",
    "profile",
    "recipe_detail",
    "diet_plan",
]

app = Flask(__name__)
CORS(app)  # apply CORS globally

# Configure app settings
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['JSON_SORT_KEYS'] = False

registered = []

def try_register_blueprint_from_module(mod, attr_name):
    """
    Register blueprint attribute attr_name from module `mod` if present.
    Avoid double-registering by checking app.blueprints keys.
    """
    if not hasattr(mod, attr_name):
        return False
    bp = getattr(mod, attr_name)
    try:
        # blueprint.name is the key used in app.blueprints
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

    # 1) register any attribute that ends with _bp and looks like a Flask blueprint
    blueprint_registered = False
    for attr in dir(mod):
        if attr.endswith("_bp"):
            if try_register_blueprint_from_module(mod, attr):
                blueprint_registered = True

    # 2) register common blueprint names if present
    common_blueprints = ("bp", "blueprint", "home_bp", "extractor_bp", "diet_bp", "fridge_bp", "nutrition_bp")
    for common in common_blueprints:
        if hasattr(mod, common):
            if try_register_blueprint_from_module(mod, common):
                blueprint_registered = True

    # 3) call init_app(app) if present
    if hasattr(mod, "init_app"):
        try:
            mod.init_app(app)
            registered.append(f"{name}.init_app")
            print(f"[server] ✅ called init_app on {name}")
        except Exception as e:
            print(f"[server] ❌ init_app failed for {name}: {e}")

    # 4) If no blueprint was registered but the module has routes, register a default blueprint
    if not blueprint_registered and hasattr(mod, 'routes'):
        print(f"[server] ℹ️  Module {name} has routes but no blueprint - consider adding a blueprint")

# --------------------------
# Enhanced explicit module registration with better error handling
# --------------------------
def register_module_explicitly(module_name, blueprint_name=None):
    """Explicitly register a module with optional specific blueprint name"""
    try:
        mod = importlib.import_module(module_name)
        print(f"[server] 🔍 explicitly importing: {module_name}")
        
        if blueprint_name and hasattr(mod, blueprint_name):
            try_register_blueprint_from_module(mod, blueprint_name)
        else:
            # Try common blueprint names
            blueprints_to_try = [blueprint_name] if blueprint_name else []
            blueprints_to_try.extend(["bp", "blueprint", f"{module_name}_bp", "extractor_bp"])
            
            for bp_name in blueprints_to_try:
                if bp_name and hasattr(mod, bp_name):
                    if try_register_blueprint_from_module(mod, bp_name):
                        break
            else:
                # If no specific blueprint found, try auto-discovery
                try_register_module(module_name)
                
    except Exception as e:
        print(f"[server] ❌ explicit registration failed for {module_name}: {e}")

# --------------------------
# Explicit module registration (idempotent & resilient)
# --------------------------
print("[server] 🚀 Starting server initialization...")

# Register critical modules explicitly first
critical_modules = [
    ("fridge", "fridge_bp"),
    ("nutrition_extractor", "bp"),  # nutrition_extractor uses 'bp' as blueprint name
    ("recipe_extractor", "extractor_bp"),  # recipe_extractor uses 'extractor_bp'
    ("home", "bp"),
]

for module_name, bp_name in critical_modules:
    register_module_explicitly(module_name, bp_name)

# Try to register modules listed in AUTO_MODULES (skip already registered)
for m in AUTO_MODULES:
    # Check if module is already registered
    already_registered = any(reg.startswith(f"{m}.") for reg in registered)
    if not already_registered:
        print(f"[server] 🔄 auto-registering: {m}")
        try_register_module(m)
    else:
        print(f"[server] ⏩ skipping already registered: {m}")

# Optionally autodiscover other local modules in the current directory
print("[server] 🔍 Discovering additional modules in current directory...")
for finder, modname, ispkg in pkgutil.iter_modules([os.getcwd()]):
    # avoid re-importing server itself and already processed modules
    if modname in ("server",) or modname in AUTO_MODULES:
        continue
    
    # Skip if already registered
    already_registered = any(reg.startswith(f"{modname}.") for reg in registered)
    if not already_registered:
        print(f"[server] 🔄 discovered module: {modname}")
        try_register_module(modname)
    else:
        print(f"[server] ⏩ skipping already registered discovered module: {modname}")

# --------------------------
# Helper to register a direct route if blueprint route is not present.
# This provides fallback endpoints that call into module functions when blueprints fail.
# --------------------------
def _route_exists_for_rule(rule_str: str) -> bool:
    return any(rule.rule == rule_str for rule in app.url_map.iter_rules())

def _safe_register_direct(module_name: str, func_name: str, url_rule: str, methods=("POST",)):
    """
    Attempt to import module_name, find function func_name, and register a top-level route
    at url_rule that calls that function. Only registers if the url_rule isn't already present.
    """
    if _route_exists_for_rule(url_rule):
        print(f"[server] ⏩ route {url_rule} already exists (likely from blueprint). Skipping direct registration.")
        return False

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

    # register a wrapper so we can call the module function safely (it expects Flask request context)
    def _wrapper(*args, **kwargs):
        try:
            return view_func(*args, **kwargs)
        except Exception as e:
            # If invoking directly fails, return helpful error
            return jsonify({
                "success": False,
                "error": f"Error invoking {module_name}.{func_name}: {str(e)}"
            }), 500

    # Only add rule if not present
    try:
        app.add_url_rule(url_rule, endpoint_name, _wrapper, methods=list(methods))
        registered.append(f"{module_name}.{func_name}->route:{url_rule}")
        print(f"[server] ✅ Direct route registered: {url_rule} -> {module_name}.{func_name}")
        return True
    except Exception as e:
        print(f"[server] ❌ Failed to add direct route {url_rule}: {e}")
        return False

# --------------------------
# Register common direct fallback endpoints (only if not provided by blueprints)
# This helps the frontend which POSTs to exactly these paths.
# --------------------------
fallback_mappings = [
    # Nutrition Extractor endpoints
    ("nutrition_extractor", "analyze_nutrition", "/api/analyze-nutrition", ("POST",)),
    ("nutrition_extractor", "enhance_nutrition", "/api/enhance-nutrition", ("POST",)),
    ("nutrition_extractor", "get_models", "/api/models", ("GET",)),
    ("nutrition_extractor", "health", "/api/health", ("GET",)),
    
    # Recipe Extractor endpoints
    ("recipe_extractor", "extractor_photo", "/extractor/photo", ("POST",)),
    ("recipe_extractor", "extractor_dish_name", "/extractor/dish-name", ("POST",)),
    ("recipe_extractor", "extractor_url", "/extractor/url", ("POST",)),
    ("recipe_extractor", "extractor_enhance", "/extractor/enhance", ("POST",)),
    ("recipe_extractor", "health", "/extractor/health", ("GET",)),
]

for mod_name, fn_name, url, methods in fallback_mappings:
    _safe_register_direct(mod_name, fn_name, url, methods)

# --------------------------
# Nutrition-specific API routes (additional endpoints)
# --------------------------
@app.route("/api/nutrition/health", methods=["GET"])
def nutrition_health():
    """Nutrition-specific health check"""
    return jsonify({
        "status": "healthy",
        "service": "Nutrition Analyzer",
        "timestamp": getattr(os.times(), 'elapsed', None) or None
    }), 200

@app.route("/api/nutrition/test", methods=["GET"])
def nutrition_test():
    """Test endpoint for nutrition analyzer"""
    return jsonify({
        "success": True,
        "message": "Nutrition analyzer is working",
        "endpoints": {
            "analyze_nutrition": "POST /api/analyze-nutrition",
            "enhance_nutrition": "POST /api/enhance-nutrition",
            "models": "GET /api/models",
            "health": "GET /api/health"
        }
    }), 200

# --------------------------
# Health check and status routes
# --------------------------
@app.route("/", methods=["GET"])
def root():
    """Root endpoint with server status"""
    bp_list = list(app.blueprints.keys())
    
    # Get detailed blueprint info
    blueprint_info = []
    for name, bp in app.blueprints.items():
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint.startswith(f"{name}."):
                routes.append({
                    "endpoint": rule.endpoint,
                    "methods": list(rule.methods),
                    "path": rule.rule
                })
        blueprint_info.append({
            "name": name,
            "url_prefix": bp.url_prefix,
            "routes_count": len(routes),
            "routes": [r["path"] for r in routes[:5]]  # Show first 5 routes
        })
    
    return jsonify({
        "success": True,
        "message": "Nutrition & Recipe Analysis Backend Running",
        "status": "healthy",
        "version": "1.0.0",
        "registered_modules": registered,
        "total_blueprints": len(bp_list),
        "blueprints": bp_list,
        "blueprint_details": blueprint_info,
        "total_endpoints": len(list(app.url_map.iter_rules()))
    }), 200

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for load balancers and monitoring"""
    return jsonify({
        "status": "healthy",
        "service": "Nutrition Analysis Server",
        "timestamp": getattr(os.times(), 'elapsed', None) or None,
        "registered_modules": len(registered),
        "active_blueprints": list(app.blueprints.keys())
    }), 200

@app.route("/api/status", methods=["GET"])
def api_status():
    """Detailed API status"""
    blueprints_info = []
    total_routes = 0
    
    for name, bp in app.blueprints.items():
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint.startswith(f"{name}."):
                routes.append({
                    "endpoint": rule.endpoint,
                    "methods": list(rule.methods),
                    "path": rule.rule
                })
        total_routes += len(routes)
        blueprints_info.append({
            "name": name,
            "url_prefix": bp.url_prefix,
            "routes_count": len(routes),
            "routes": routes
        })
    
    # Get all routes for overview
    all_routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':  # Skip static files
            all_routes.append({
                "endpoint": rule.endpoint,
                "methods": list(rule.methods),
                "path": rule.rule
            })
    
    return jsonify({
        "app_name": "Nutrition & Recipe Analysis Server",
        "version": "1.0.0",
        "status": "healthy",
        "blueprints": blueprints_info,
        "total_blueprints": len(blueprints_info),
        "total_endpoints": total_routes,
        "all_routes": all_routes
    }), 200

@app.route("/api/services", methods=["GET"])
def api_services():
    """List all available services and their endpoints"""
    services = {
        "nutrition_analyzer": {
            "description": "AI-powered nutrition analysis from images and text",
            "endpoints": {
                "analyze_nutrition": {"method": "POST", "path": "/api/analyze-nutrition"},
                "enhance_nutrition": {"method": "POST", "path": "/api/enhance-nutrition"},
                "get_models": {"method": "GET", "path": "/api/models"},
                "health": {"method": "GET", "path": "/api/health"}
            }
        },
        "recipe_extractor": {
            "description": "Extract recipes from images, URLs, and dish names",
            "endpoints": {
                "extract_from_photo": {"method": "POST", "path": "/extractor/photo"},
                "extract_from_dish_name": {"method": "POST", "path": "/extractor/dish-name"},
                "extract_from_url": {"method": "POST", "path": "/extractor/url"},
                "enhance_recipe": {"method": "POST", "path": "/extractor/enhance"}
            }
        },
        "system": {
            "description": "Server management and monitoring",
            "endpoints": {
                "root": {"method": "GET", "path": "/"},
                "health": {"method": "GET", "path": "/health"},
                "status": {"method": "GET", "path": "/api/status"},
                "services": {"method": "GET", "path": "/api/services"}
            }
        }
    }
    
    return jsonify({
        "success": True,
        "services": services
    }), 200

# --------------------------
# Error handlers
# --------------------------
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "message": "The requested resource was not found on this server",
        "available_services": [
            "Nutrition Analyzer: POST /api/analyze-nutrition",
            "Recipe Extractor: POST /extractor/photo", 
            "System Health: GET /health"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "support": "Check the server logs for detailed error information"
    }), 500

@app.errorhandler(413)
def too_large(error):
    return jsonify({
        "success": False,
        "error": "File too large",
        "message": "The uploaded file exceeds the maximum allowed size (16MB)",
        "max_size": "16MB"
    }), 413

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "success": False,
        "error": "Method not allowed",
        "message": "The HTTP method is not supported for this endpoint"
    }), 405

# --------------------------
# Server startup
# --------------------------
if __name__ == "__main__":
    # Ensure current directory on sys.path so local imports work when running server.py
    cwd = os.getcwd()
    if cwd not in sys.path:
        sys.path.insert(0, cwd)

    print(f"[server] 📊 Server Summary:")
    print(f"[server] ✅ Registered modules: {len(registered)}")
    print(f"[server] ✅ Blueprints: {list(app.blueprints.keys())}")
    
    # Show available endpoints by blueprint
    print(f"[server] 🌐 Available endpoints:")
    for name, bp in app.blueprints.items():
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint.startswith(f"{name}.") and rule.endpoint != 'static':
                routes.append(rule.rule)
        if routes:
            print(f"[server]   {name}:")
            for route in sorted(routes)[:3]:  # Show first 3 routes per blueprint
                print(f"[server]     - {route}")
            if len(routes) > 3:
                print(f"[server]     ... and {len(routes) - 3} more routes")
    
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[server] 🌐 Starting server on http://{host}:{port}")
    
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    if debug_mode:
        print("[server] 🔧 Debug mode: ON")
    
    # Print important URLs
    print(f"[server] 🔗 Important URLs:")
    print(f"[server]   - Server status: http://{host}:{port}/")
    print(f"[server]   - Health check: http://{host}:{port}/health")
    print(f"[server]   - API status: http://{host}:{port}/api/status")
    print(f"[server]   - Nutrition analyzer: http://{host}:{port}/api/analyze-nutrition")
    print(f"[server]   - Recipe extractor: http://{host}:{port}/extractor/photo")
    
    app.run(
        host=host, 
        port=port, 
        debug=debug_mode,
        threaded=True
    )