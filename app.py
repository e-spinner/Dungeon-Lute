from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import datetime
import logging

app = Flask( __name__ )

# Paths to directories
MUSIC_PATH = os.path.join( app.root_path, 'music' )
PRESETS_PATH = os.path.join( app.root_path, 'static', 'presets' )

# Home Page
@app.route( '/' )
def index():
    return render_template( 'index.html' )

# ======== #
# MENU-BAR #
# ======== #

# Request list of presets
@app.route( '/load' )
def get_presets():
    # List to hold the names of all presets
    presets = []
    
    # Get a list of all.json files in the presets directory
    json_files = [f for f in os.listdir(PRESETS_PATH) if f.endswith('.json')]
    
    # Extract the names of the presets by removing the.json extension
    for preset in json_files:
        name = presets[:-5]  # Remove the.json extension
        presets.append(name)
    
    # Return the list of preset names
    return jsonify(presets)
    
# Request for preset.json
@app.route( '/load/<preset>' )
def get_preset( preset ):
    try:
        with open( os.path.join( PRESETS_PATH, str(preset) + '.json' ), 'r' ) as file:
            playlists = json.load( file )
    except FileNotFoundError:
        playlists = []
    return jsonify( playlists )  
    
# ========== #
# SOUNDBOARD #
# ========== #
  
# Request current list of playlists
@app.route( '/playlists' )
def get_playlists():
    playlists = [dir for dir in os.listdir( MUSIC_PATH ) if os.path.isdir( os.path.join( MUSIC_PATH, dir ) )]
    return jsonify( playlists )

# Request list of songs in  a playlist
@app.route( '/song/<playlist>' )
def get_songs( playlist ):
    playlist_path = os.path.join( MUSIC_PATH, playlist )
    songs = [file for file in os.listdir( playlist_path ) if file.endswith( '.mp3' )]
    return jsonify( songs )

# Request song
@app.route( '/song/<playlist>/<song>' )
def get_song( playlist, song ):
    return send_from_directory( MUSIC_PATH + '/' + playlist, song )

# ========= #
# UTILITIES #
# ========= #

# print log statements to terminal
@app.route( '/log', methods=['POST'] )
def log():
    data = request.get_json();
    
    origin = data['origin'];
    message = data['message'];

    timestamp = datetime.datetime.now().strftime('%d/%b/%Y %H:%M:%S')
    
    print( f'\033[34m{request.remote_addr} - - [{timestamp}][{origin.upper()}]: {message}\033[0m')

    
    return jsonify( {"status": "success"} )
    
# ==== #
# EDIT #
# ==== #

# switch to edit page
@app.route( '/edit' )
def edit():
    return render_template( 'edit.html' )  

# Save current setup to <name>.json
@app.route( '/save/<name>', methods=['POST'] )
def save( name ):
    soundBoard = request.json
    with open( os.path.join( PRESETS_PATH, str(name) + '.json' ), 'w' ) as file:
        file.write( '' )
        json.dump( soundBoard, file )
    return jsonify( {"status": "success"} )

if __name__ == '__main__':
    app.run( debug=True )


