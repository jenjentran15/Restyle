"""
Image processing service for wardrobe optimization
Handles background removal and clothing analysis
"""

import cv2
import numpy as np
from PIL import Image
import io
import base64
from rembg import remove
import requests

class ImageProcessor:
    @staticmethod
    def remove_background(image_data):
        """
        Remove background from clothing image using rembg
        
        Args:
            image_data: Image data (bytes or file path)
            
        Returns:
            Processed image as base64 string
        """
        try:
            # Load image
            if isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data)).convert('RGBA')
            else:
                image = Image.open(image_data).convert('RGBA')
            
            # Remove background
            output = remove(image)
            
            # Convert to base64 for return
            buffer = io.BytesIO()
            output.save(buffer, format='PNG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return {
                'success': True,
                'processedImage': f'data:image/png;base64,{img_base64}',
                'format': 'PNG'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def analyze_clothing_color(image_path):
        """
        Analyze dominant colors in clothing image
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of dominant colors with percentages
        """
        try:
            image = cv2.imread(image_path)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Reshape to list of pixels
            pixels = image.reshape((-1, 3))
            pixels = np.float32(pixels)
            
            # K-means clustering
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            k = 5  # Top 5 colors
            _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
            
            centers = np.uint8(centers)
            
            # Calculate color percentages
            unique, counts = np.unique(labels, return_counts=True)
            colors = []
            
            for i in sorted(unique):
                color_rgb = centers[i]
                percentage = np.sum(counts[i]) / len(labels) * 100
                colors.append({
                    'rgb': color_rgb.tolist(),
                    'percentage': round(percentage, 2),
                    'hex': '#{:02x}{:02x}{:02x}'.format(int(color_rgb[0]), int(color_rgb[1]), int(color_rgb[2]))
                })
            
            return {
                'success': True,
                'dominantColors': sorted(colors, key=lambda x: x['percentage'], reverse=True)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def resize_image(image_data, width=400, height=500):
        """
        Resize image to standard dimensions
        
        Args:
            image_data: Image data (bytes)
            width: Target width
            height: Target height
            
        Returns:
            Resized image as bytes
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Maintain aspect ratio
            image.thumbnail((width, height), Image.Resampling.LANCZOS)
            
            # Create new image with white background
            new_image = Image.new('RGB', (width, height), (255, 255, 255))
            offset = ((width - image.width) // 2, (height - image.height) // 2)
            new_image.paste(image, offset)
            
            # Convert to bytes
            buffer = io.BytesIO()
            new_image.save(buffer, format='JPEG', quality=80)
            return buffer.getvalue()
        except Exception as e:
            raise Exception(f"Error resizing image: {str(e)}")
    
    @staticmethod
    def get_clothing_recommendations(colors):
        """
        Get outfit recommendations based on clothing colors
        
        Args:
            colors: List of clothing item colors
            
        Returns:
            Compatibility recommendations
        """
        color_compatibility = {
            'warm': ['beige', 'brown', 'gold', 'orange', 'red'],
            'cool': ['blue', 'purple', 'pink', 'silver', 'gray'],
            'neutral': ['black', 'white', 'gray', 'beige']
        }
        
        recommendations = {
            'compatible_items': [],
            'suggested_accessories': [],
            'outfit_style': '',
            'suggestions': []
        }
        
        # Basic recommendations logic
        if len(colors) > 0:
            recommended_palette = 'neutral'
            recommendations['outfit_style'] = 'Versatile and timeless'
            recommendations['suggestions'] = [
                'Pair with neutral pieces for a balanced look',
                'Add layering for depth',
                'Consider texture combinations',
                'Accessorize with complementary colors'
            ]
        
        return recommendations

def process_uploaded_image(image_data, filename):
    """
    Main function to process uploaded image
    
    Args:
        image_data: Image file data
        filename: Original filename
        
    Returns:
        Processing result with metadata
    """
    processor = ImageProcessor()
    
    try:
        # Remove background
        bg_removed = processor.remove_background(image_data)
        
        if not bg_removed['success']:
            return {'error': bg_removed['error']}, 500
        
        # Resize image
        resized = processor.resize_image(image_data)
        
        return {
            'success': True,
            'processedImage': bg_removed['processedImage'],
            'filename': filename
        }, 200
    except Exception as e:
        return {'error': str(e)}, 500
