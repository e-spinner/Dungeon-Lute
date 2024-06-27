from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json

app = Flask( __name__ )

# Paths to directories
SOUNDS_PATH = os.path.join( app.root_path, 'static', 'sounds' )
PRESETS_PATH = os.path.join( app.root_path, 'presets' )

# Home Page
@app.route( '/' )
def index():
    return render_template( 'index.html' )
  
# Request for buttons
@app.route('/get_buttons')
def get_buttons():
    try:
        with open(os.path.join(PRESETS_PATH, 'buttons.json'), 'r') as f:
            buttons = json.load(f)
    except FileNotFoundError:
        buttons = []
    return jsonify(buttons)  

# Save Current Buttons
@app.route('/save_buttons', methods=['POST'])
def save_buttons():
    buttons = request.json
    with open(os.path.join(PRESETS_PATH, 'buttons.json'), 'w') as f:
        json.dump(buttons, f)
    return jsonify({"status": "success"})

@app.route('/upload', methods=['POST'])
def upload_sound():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"})
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"})
    
    if file:
        filepath = os.path.join(SOUNDS_PATH, file.filename)
        file.save(filepath)
        return jsonify({"filename": file.filename})
    
    return jsonify({"error": "File upload failed"})

@app.route('/sounds/<filename>')
def get_sound(filename):
    return send_from_directory( SOUNDS_PATH, filename )

if __name__ == '__main__':
    app.run( debug=True )