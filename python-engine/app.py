from flask import Flask, request, jsonify
from flask_cors import CORS
from engine import WardrobeAnalysisEngine
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

engine = WardrobeAnalysisEngine()

@app.route('/api/analyze/outfit-combinations', methods=['POST'])
def analyze_outfit_combinations():
    """
    Analyze outfit combinations for a wardrobe
    """
    try:
        clothing_items = request.json.get('items', [])
        result = engine.analyze_outfit_compatibility(clothing_items)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/generate-capsule', methods=['POST'])
def generate_capsule():
    """
    Generate AI-powered capsule wardrobe recommendations
    """
    try:
        clothing_items = request.json.get('items', [])
        preferences = request.json.get('preferences', {})
        result = engine.generate_capsule_wardrobe(clothing_items, preferences)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/get-recommendations', methods=['POST'])
def get_recommendations():
    """
    Get personalized wardrobe recommendations using AI
    """
    try:
        clothing_items = request.json.get('items', [])
        analysis = request.json.get('analysis', {})
        result = engine.get_ai_recommendations(clothing_items, analysis)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'OK',
        'service': 'Wardrobe Capsule Optimizer - Python Engine',
        'device': str(engine.device)
    })

if __name__ == '__main__':
    port = int(os.getenv('PYTHON_ENGINE_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
    app.run(debug=True, port=port)
