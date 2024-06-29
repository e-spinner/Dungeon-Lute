from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import datetime
import logging

app = Flask( __name__ )

# Paths to directories
SOUNDS_PATH = os.path.join( app.root_path, 'music' )
PRESETS_PATH = os.path.join( app.root_path, 'presets' )

# Home Page
@app.route( '/' )
def index():
    return render_template( 'index.html' )

# ======== #
# MENU-BAR #
# ======== #
  
# Save current setup to <preset>.json
@app.route( '/save/<preset>', methods=['POST'] )
def save( preset ):
    playlists = request.json
    with open( os.path.join( PRESETS_PATH, str(preset) + '.json' ), 'w' ) as file:
        file.write( '' )
        json.dump( playlists, file )
    return jsonify( {"status": "success"} )
  
# ========== #
# SOUNDBOARD #
# ========== #
  
# Request for buttons.json
@app.route( '/load/<preset>' )
def load( preset ):
    try:
        with open( os.path.join( PRESETS_PATH, str(preset) + 'json' ), 'r' ) as file:
            playlists = json.load( file )
    except FileNotFoundError:
        playlists = []
    return jsonify( playlists )  

# retrive song
@app.route( '/song/<playlist>/<song>' )
def get_sound( playlist, song ):
    return send_from_directory( SOUNDS_PATH + '/' + playlist, song )

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
    
# switch to edit page
@app.route( '/edit' )
def edit():
    return render_template( 'edit.html' )  
     
# find current playlists
@app.route( '/playlists' )
def find_playlists():
    playlists = [dir for dir in os.listdir( SOUNDS_PATH ) if os.path.isdir( os.path.join( SOUNDS_PATH, dir ) )]
    return jsonify( playlists )
    
# retrive list of song in playlist
@app.route( '/get_songs/<playlist>' )
def get_songs( playlist ):
    playlist_path = os.path.join( SOUNDS_PATH, playlist )
    songs = [file for file in os.listdir( playlist_path ) if file.endswith( '.mp3' )]
    return jsonify( songs )

if __name__ == '__main__':
    app.run( debug=True )


