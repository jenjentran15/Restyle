"""
Wardrobe Capsule Optimizer - Analysis Engine
Uses PyTorch for outfit compatibility analysis and OpenAI API for AI recommendations
"""

import os
from dotenv import load_dotenv

load_dotenv()

import torch
import numpy as np
from openai import OpenAI
from itertools import combinations

class WardrobeAnalysisEngine:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = None
        
        # Color compatibility matrix
        self.color_compatibility = {
            'black': ['white', 'gray', 'navy', 'red', 'green', 'brown'],
            'white': ['black', 'gray', 'navy', 'red', 'blue', 'green'],
            'gray': ['black', 'white', 'navy', 'red', 'green', 'brown'],
            'navy': ['white', 'gray', 'black', 'red', 'brown'],
            'red': ['black', 'white', 'gray', 'navy', 'pink'],
            'blue': ['white', 'gray', 'black', 'green', 'brown'],
            'green': ['white', 'gray', 'navy', 'brown', 'beige'],
            'brown': ['white', 'gray', 'navy', 'green', 'beige'],
            'pink': ['white', 'gray', 'black', 'red'],
            'beige': ['white', 'gray', 'brown', 'navy']
        }
    
    def analyze_outfit_compatibility(self, items):
        """
        Analyze outfit combinations for compatibility
        Uses PyTorch for efficient tensor operations
        """
        try:
            if not items or len(items) < 2:
                return {
                    'total_outfits': 0,
                    'compatible_pairs': [],
                    'utilization': []
                }
            
            # Convert items to tensors for analysis
            categories = [item.get('category', '') for item in items]
            colors = [item.get('color', '').lower() for item in items]
            formality_levels = [item.get('formality', '') for item in items]
            
            # Calculate compatible combinations
            compatible_pairs = []
            for i, item1 in enumerate(items):
                for j, item2 in enumerate(items):
                    if i < j:  # Avoid duplicates
                        compatibility_score = self._calculate_compatibility(item1, item2)
                        if compatibility_score > 0.5:  # Only include compatible pairs
                            compatible_pairs.append({
                                'item1_id': i,
                                'item2_id': j,
                                'score': compatibility_score
                            })
            
            # Calculate total possible outfits (items grouped by category)
            categories_set = set(categories)
            total_outfits = 1
            for cat in categories_set:
                count = categories.count(cat)
                total_outfits *= count
            
            # Calculate item utilization
            utilization = self._calculate_utilization(items, compatible_pairs)
            
            return {
                'total_outfits': total_outfits,
                'compatible_pairs': len(compatible_pairs),
                'utilization': utilization,
                'analysis': {
                    'categories': list(categories_set),
                    'total_items': len(items),
                    'compatibility_matrix': compatible_pairs[:10]  # Top 10 for UI
                }
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_compatibility(self, item1, item2):
        """
        Calculate compatibility score between two items
        Considers formality, color, and category
        """
        score = 1.0
        
        # Category compatibility
        tops = ['top', 'shirt', 'blouse']
        bottoms = ['bottom', 'pants', 'skirt', 'jeans']
        outerwear = ['jacket', 'coat', 'cardigan']
        
        cat1 = item1.get('category', '').lower()
        cat2 = item2.get('category', '').lower()
        
        # Reduce score if same category
        if cat1 == cat2 and cat1 not in outerwear:
            score *= 0.3
        
        # Increase score for complementary categories
        if (cat1 in tops and cat2 in bottoms) or (cat1 in bottoms and cat2 in tops):
            score *= 1.5
        
        # Color compatibility
        color1 = item1.get('color', '').lower()
        color2 = item2.get('color', '').lower()
        
        if color1 in self.color_compatibility:
            if color2 in self.color_compatibility[color1]:
                score *= 1.2
            else:
                score *= 0.6
        
        # Formality compatibility
        form1 = item1.get('formality', '').lower()
        form2 = item2.get('formality', '').lower()
        
        if form1 == form2:
            score *= 1.1
        elif (form1 in ['casual', 'business'] and form2 in ['casual', 'business']):
            score *= 0.9
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _calculate_utilization(self, items, compatible_pairs):
        """
        Calculate how often each item is used in outfits
        """
        utilization = []
        
        for i, item in enumerate(items):
            usage_count = sum(1 for pair in compatible_pairs if pair['item1_id'] == i or pair['item2_id'] == i)
            percentage = (usage_count / len(compatible_pairs) * 100) if compatible_pairs else 0
            
            utilization.append({
                'id': i,
                'name': item.get('name', f'Item {i}'),
                'category': item.get('category', 'unknown'),
                'usage_count': usage_count,
                'utilization_percentage': round(percentage, 1)
            })
        
        return sorted(utilization, key=lambda x: x['usage_count'], reverse=True)
    
    def generate_capsule_wardrobe(self, items, preferences):
        """
        Generate an optimized capsule wardrobe using PyTorch
        """
        try:
            if not items:
                return {
                    'capsule': [],
                    'recommendations': ['Start by adding items to your wardrobe']
                }
            
            desired_size = preferences.get('desiredSize', 20)
            lifestyle = preferences.get('lifestyle', 'mixed')
            climate = preferences.get('climate', 'temperate')
            
            # Score items based on versatility and fit
            scored_items = []
            for i, item in enumerate(items):
                score = self._calculate_item_versatility(item, lifestyle, climate)
                scored_items.append({
                    'index': i,
                    'item': item,
                    'score': score
                })
            
            # Select top items for capsule
            scored_items.sort(key=lambda x: x['score'], reverse=True)
            capsule = scored_items[:desired_size]
            
            # Group by category
            by_category = {}
            for cap in capsule:
                cat = cap['item'].get('category', 'other')
                if cat not in by_category:
                    by_category[cat] = []
                by_category[cat].append(cap['item'])
            
            return {
                'capsule_size': len(capsule),
                'items_by_category': by_category,
                'total_items': len(items),
                'reduction_percentage': round((1 - len(capsule) / len(items)) * 100, 1),
                'recommendations': self._generate_capsule_recommendations(capsule, lifestyle, climate)
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_item_versatility(self, item, lifestyle, climate):
        """
        Calculate versatility score for an item
        Higher score = more versatile
        """
        score = 5.0  # Base score
        
        # Category versatility
        category = item.get('category', '').lower()
        versatile_categories = {
            'top': 2.0,
            'bottom': 1.8,
            'jacket': 1.5,
            'cardigan': 1.6,
            'shoes': 1.2,
            'accessory': 0.8
        }
        score += versatile_categories.get(category, 0.5)
        
        # Formality versatility
        formality = item.get('formality', '').lower()
        if formality == 'casual':
            if lifestyle == 'casual':
                score += 2.0
            elif lifestyle == 'mixed':
                score += 1.5
        elif formality == 'business':
            if lifestyle == 'professional':
                score += 2.0
            elif lifestyle == 'mixed':
                score += 1.5
        
        # Color versatility (neutral colors are more versatile)
        color = item.get('color', '').lower()
        neutral_colors = ['black', 'white', 'gray', 'navy', 'beige', 'brown']
        if color in neutral_colors:
            score += 1.5
        
        # Season versatility
        season = item.get('season', '').lower()
        if season == 'all':
            score += 1.0
        elif climate == 'varied' and season in ['winter', 'summer']:
            score += 0.5
        
        return score
    
    def _generate_capsule_recommendations(self, capsule, lifestyle, climate):
        """
        Generate recommendations for the capsule wardrobe
        """
        recommendations = []
        
        category_counts = {}
        for item in capsule:
            cat = item['item'].get('category', 'other')
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Basic recommendations
        if category_counts.get('top', 0) >= 5:
            recommendations.append(f"You have {category_counts['top']} tops - great for versatility!")
        
        if category_counts.get('bottom', 0) >= 4:
            recommendations.append(f"You have {category_counts['bottom']} bottoms - good mix for different occasions")
        
        if lifestyle == 'professional':
            recommendations.append("Consider adding 1-2 more structured pieces for professional settings")
        elif lifestyle == 'casual':
            recommendations.append("Your capsule is tailored for casual, relaxed styling")
        else:
            recommendations.append("Your mixed lifestyle capsule balances professional and casual wear")
        
        if climate == 'cold':
            recommendations.append("Consider adding more layering pieces and outerwear")
        elif climate == 'tropical':
            recommendations.append("Focus on breathable, lightweight fabrics")
        
        recommendations.append(f"Your {len(capsule)}-item capsule creates multiple outfit combinations")
        
        return recommendations[:5]
    
    def get_ai_recommendations(self, items, analysis):
        """
        Get AI-powered wardrobe recommendations using OpenAI
        """
        try:
            if not self.client:
                return {
                    'recommendations': [
                        'Set your OPENAI_API_KEY environment variable to enable AI recommendations',
                        'Your wardrobe has ' + str(len(items)) + ' items',
                        'Use the outfit analyzer to see how items work together'
                    ]
                }
            
            # Build prompt from wardrobe data
            categories = {}
            for item in items:
                cat = item.get('category', 'other')
                categories[cat] = categories.get(cat, 0) + 1
            
            prompt = f"""
            I have a wardrobe with {len(items)} items:
            Categories: {', '.join([f'{k}: {v}' for k, v in categories.items()])}
            
            Give me 5 specific, actionable recommendations to:
            1. Improve outfit versatility
            2. Maximize item usage
            3. Create a cohesive capsule wardrobe
            4. Identify gaps in my wardrobe
            5. Make better future purchases
            
            Keep recommendations concise and practical.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional wardrobe stylist and fashion consultant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return {
                'recommendations': response.choices[0].message.content.split('\n'),
                'generated_at': 'now'
            }
        except Exception as e:
            return {
                'recommendations': [
                    'AI recommendations temporarily unavailable',
                    'Error: ' + str(e)
                ]
            }

if __name__ == '__main__':
    engine = WardrobeAnalysisEngine()
    
    # Example usage
    sample_items = [
        {'name': 'Blue Jeans', 'category': 'bottom', 'color': 'blue', 'formality': 'casual'},
        {'name': 'White T-shirt', 'category': 'top', 'color': 'white', 'formality': 'casual'},
        {'name': 'Black Blazer', 'category': 'jacket', 'color': 'black', 'formality': 'business'}
    ]
    print("Analysis Results:", engine.analyze_outfit_compatibility(sample_items))
