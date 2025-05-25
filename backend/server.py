import os
import uuid
import time
import asyncio
import threading
from datetime import datetime
from typing import Dict, Any, Optional
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
from dotenv import load_dotenv
from backend.create_prompt import generate_pain_description

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

PORT = int(os.getenv('PORT', 5000))

# TTAPI settings
TTAPI_KEY = "be396f95-696d-c7f0-5066-07ad81b37cbb"  # Replace with your key
TTAPI_BASE_URL = "https://api.ttapi.io/midjourney/v1"

# Simple database for storing requests and images
# (In a real case, it's better to use a database)
image_requests: Dict[str, Dict[str, Any]] = {}

def generate_pain_prompt(answers: Dict[str, Any]) -> str:
    """Function to create a prompt based on user answers"""
    return generate_pain_description(answers)
    
    
def check_ttapi_status(ttapi_job_id: str) -> Dict[str, Any]:
    """Function to check TTAPI status"""
    try:
        response = requests.post(
            f"{TTAPI_BASE_URL}/fetch",
            json={"jobId": ttapi_job_id},
            headers={
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except Exception as error:
        print(f'Error checking TTAPI status: {error}')
        raise error

def handle_ttapi_process(request_id: str, prompt: str):
    """Function to handle TTAPI process"""
    try:
        print(f"🎨 Sending request to TTAPI for: {request_id}")

        # Send request to TTAPI
        ttapi_response = requests.post(
            f"{TTAPI_BASE_URL}/imagine",
            json={
                "prompt": f"{prompt} --ar 1:1 --stylize 500",
                "mode": "fast",
                "timeout": 300
            },
            headers={
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout=60
        )
        ttapi_response.raise_for_status()
        
        response_data = ttapi_response.json()
        ttapi_job_id = response_data.get('data', {}).get('jobId') or response_data.get('jobId')

        if not ttapi_job_id:
            raise Exception('No job ID received from TTAPI')

        print(f"✅ TTAPI job created: {ttapi_job_id} for request: {request_id}")

        # Update request with TTAPI job ID
        if request_id in image_requests:
            image_requests[request_id]['ttapiJobId'] = ttapi_job_id

        # Recursive function to check status
        def check_status_recursively(attempt=1, max_attempts=30):
            try:
                print(f"🔍 Checking TTAPI status for {request_id}, attempt {attempt}/{max_attempts}")

                status_data = check_ttapi_status(ttapi_job_id)
                status = status_data.get('status')

                if status == "SUCCESS":
                    # Extract image URL
                    image_url = (status_data.get('data', {}).get('cdnImage') or
                               status_data.get('data', {}).get('discordImage') or
                               status_data.get('data', {}).get('url'))

                    if image_url:
                        if request_id in image_requests:
                            image_requests[request_id].update({
                                'status': 'completed',
                                'completedAt': datetime.now().isoformat(),
                                'imageUrl': image_url
                            })
                        print(f"✅ TTAPI request {request_id} completed successfully with image: {image_url}")
                    else:
                        raise Exception('Image URL not found in TTAPI response')

                elif status == "FAILED":
                    raise Exception(f"TTAPI generation failed: {status_data.get('message', 'Unknown error')}")

                elif attempt >= max_attempts:
                    raise Exception(f"TTAPI timeout: Max attempts ({max_attempts}) reached")

                else:
                    # Still processing, check again after 10 seconds
                    print(f"⏳ TTAPI still processing {request_id}, status: {status}")
                    threading.Timer(10.0, lambda: check_status_recursively(attempt + 1, max_attempts)).start()

            except Exception as error:
                print(f"❌ Error in TTAPI status check for {request_id}: {error}")

                # Update request as failed
                if request_id in image_requests:
                    image_requests[request_id].update({
                        'status': 'failed',
                        'error': str(error),
                        'completedAt': datetime.now().isoformat()
                    })

        # Start checking status after 15 seconds (initial time for image creation)
        threading.Timer(15.0, check_status_recursively).start()

    except Exception as error:
        print(f"❌ Error in TTAPI process for {request_id}: {error}")

        # Update request as failed
        if request_id in image_requests:
            image_requests[request_id].update({
                'status': 'failed',
                'error': f"TTAPI Error: {error}",
                'completedAt': datetime.now().isoformat()
            })

# === ENDPOINTS ===

# The existing /submit endpoint
@app.route('/submit', methods=['POST'])
def submit():
    try:
        data = request.get_json()
        answers = data.get('answers', {})
        print(f'📩 Received answers: {answers}')

        # Create prompt
        prompt = generate_pain_prompt(answers)

        # Here, you can store the answers in a database
        # For now, we'll just send a success response with the prompt
        return jsonify({
            'message': 'Answers received successfully!',
            'prompt': prompt
        }), 200
    except Exception as error:
        print(f'❌ Error handling answers: {error}')
        return jsonify({'message': 'Internal server error'}), 500

# === TTAPI Endpoints ===

# 1. Create new image request with real TTAPI
@app.route('/api/create-image', methods=['POST'])
def create_image():
    try:
        data = request.get_json()
        answers = data.get('answers')
        prompt = data.get('prompt')

        if not prompt:
            return jsonify({'message': 'Prompt is required'}), 400

        # Create unique identifier for request
        request_id = str(uuid.uuid4())

        # Save request in storage with initial status
        image_requests[request_id] = {
            'requestId': request_id,
            'status': 'processing',
            'createdAt': datetime.now().isoformat(),
            'prompt': prompt,
            'answers': answers
        }

        print(f'📝 Created new image request: {request_id} with prompt: "{prompt}"')

        # Send to TTAPI asynchronously (doesn't block the response)
        threading.Thread(target=handle_ttapi_process, args=(request_id, prompt)).start()

        # Return immediate response to client
        return jsonify({
            'requestId': request_id,
            'message': 'Image request created successfully',
            'estimatedTime': '1-2 minutes'
        }), 200

    except Exception as error:
        print(f'❌ Error creating image request: {error}')
        return jsonify({
            'message': 'Internal server error',
            'error': str(error)
        }), 500

# 2. Check request status (unchanged)
@app.route('/api/check-status/<request_id>', methods=['GET'])
def check_status(request_id):
    try:
        # Search for request in storage
        request_data = image_requests.get(request_id)

        if not request_data:
            return jsonify({'message': 'Request not found'}), 404

        # Send current status
        return jsonify({
            'requestId': request_id,
            'status': request_data.get('status'),
            'createdAt': request_data.get('createdAt'),
            'completedAt': request_data.get('completedAt'),
            'imageUrl': request_data.get('imageUrl'),
            'error': request_data.get('error'),
            'ttapiJobId': request_data.get('ttapiJobId')
        }), 200

    except Exception as error:
        print(f'❌ Error checking status for request: {error}')
        return jsonify({
            'message': 'Internal server error',
            'error': str(error)
        }), 500

# 3. Endpoint to proxy images from TTAPI (solves CORS issues)
@app.route('/api/proxy-image/<request_id>', methods=['GET'])
def proxy_image(request_id):
    try:
        # Find request in storage
        request_data = image_requests.get(request_id)

        if not request_data or not request_data.get('imageUrl'):
            return jsonify({'message': 'Image not found or not ready'}), 404

        image_url = request_data['imageUrl']
        print(f"🖼️ Proxying image for request {request_id}: {image_url}")

        # Fetch image from TTAPI
        image_response = requests.get(
            image_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/*,*/*',
                'Referer': 'https://ttapi.io/'
            },
            timeout=30,
            stream=True
        )
        image_response.raise_for_status()

        # Create response with proper headers
        def generate():
            for chunk in image_response.iter_content(chunk_size=8192):
                yield chunk

        response = Response(generate(), content_type=image_response.headers.get('content-type', 'image/png'))
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        response.headers['Cache-Control'] = 'public, max-age=86400'  # cache for a day

        return response

    except Exception as error:
        print(f'❌ Error proxying image: {error}')
        return jsonify({
            'message': 'Error loading image',
            'error': str(error)
        }), 500

# 4. Endpoint to proxy image by direct URL (optional)
@app.route('/api/proxy-url', methods=['GET'])
def proxy_url():
    try:
        url = request.args.get('url')

        if not url:
            return jsonify({'message': 'URL parameter is required'}), 400

        # Ensure it's a TTAPI or Midjourney URL
        allowed_domains = ['ttapi.io', 'cdn.midjourney.com', 'mjcdn.ttapi.io']
        if not any(domain in url for domain in allowed_domains):
            return jsonify({'message': 'Only TTAPI/Midjourney URLs are allowed'}), 403

        print(f"🖼️ Proxying direct URL: {url}")

        image_response = requests.get(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/*,*/*',
                'Referer': 'https://ttapi.io/'
            },
            timeout=30,
            stream=True
        )
        image_response.raise_for_status()

        def generate():
            for chunk in image_response.iter_content(chunk_size=8192):
                yield chunk

        response = Response(generate(), content_type=image_response.headers.get('content-type', 'image/png'))
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        response.headers['Cache-Control'] = 'public, max-age=86400'

        return response

    except Exception as error:
        print(f'❌ Error proxying URL: {error}')
        return jsonify({
            'message': 'Error loading image from URL',
            'error': str(error)
        }), 500

# 5. Endpoint to test TTAPI connection
@app.route('/api/test-ttapi', methods=['GET'])
def test_ttapi():
    try:
        # Simple TTAPI connection test
        test_response = requests.post(
            f"{TTAPI_BASE_URL}/imagine",
            json={
                "prompt": "test prompt --ar 1:1",
                "mode": "fast"
            },
            headers={
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        test_response.raise_for_status()

        return jsonify({
            'message': 'TTAPI connection successful',
            'response': test_response.json()
        }), 200

    except Exception as error:
        print(f'TTAPI Test Error: {error}')
        return jsonify({
            'message': 'TTAPI connection failed',
            'error': str(error)
        }), 500

# 6. Endpoint to get all requests (for debugging)
@app.route('/api/requests', methods=['GET'])
def get_requests():
    all_requests = list(image_requests.values())
    return jsonify(all_requests)

# Start the server
if __name__ == '__main__':
    print(f"🚀 Server running on http://localhost:{PORT}")
    print(f"🔑 Using TTAPI key: {TTAPI_KEY[:8]}...")
    print(f"🌐 TTAPI Base URL: {TTAPI_BASE_URL}")
    app.run(host='0.0.0.0', port=PORT, debug=True)
