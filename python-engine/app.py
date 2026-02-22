from flask import Flask, request, jsonify
from flask_cors import CORS
from engine import WardrobeAnalysisEngine
from image_processor import ImageProcessor
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

engine = WardrobeAnalysisEngine()
image_processor = ImageProcessor()

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

@app.route('/api/remove-background', methods=['POST'])
def remove_background():
    """
    Remove background from clothing image
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        image_data = image_file.read()
        
        result = image_processor.remove_background(image_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/analyze-clothing-color', methods=['POST'])
def analyze_clothing_color():
    """
    Analyze dominant colors in clothing image
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        image_data = image_file.read()
        
        # Save temporarily for OpenCV processing
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp.write(image_data)
            tmp_path = tmp.name
        
        try:
            result = image_processor.analyze_clothing_color(tmp_path)
            return jsonify(result)
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/process-image', methods=['POST'])
def process_image():
    """
    Complete image processing pipeline
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        image_data = image_file.read()
        
        # Remove background
        result = image_processor.remove_background(image_data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'processedImage': result['processedImage'],
                'filename': image_file.filename
            })
        else:
            return jsonify({'error': result['error']}), 400
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
