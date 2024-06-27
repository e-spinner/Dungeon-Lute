from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json

app = Flask( __name__ )

# Paths to directories
SOUNDS_PATH = os.path.join( app.root_path, 'music' )
PRESETS_PATH = os.path.join( app.root_path, 'presets' )

# Home Page
@app.route( '/' )
def index():
    return render_template( 'index.html' )
  
# Request for buttons.json
@app.route( '/get_buttons' )
def get_buttons():
    try:
        with open( os.path.join( PRESETS_PATH, 'buttons.json' ), 'r' ) as file:
            buttons = json.load( file )
    except FileNotFoundError:
        buttons = []
    return jsonify( buttons )  

# Save Current Buttons to buttons.json
@app.route( '/save_buttons', methods=['POST'] )
def save_buttons():
    buttons = request.json
    with open( os.path.join( PRESETS_PATH, 'buttons.json' ), 'w' ) as file:
        json.dump( buttons, file )
    return jsonify( {"status": "success"} )

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

# retrive song
@app.route( '/sounds/<folder>/<filename>' )
def get_sound( folder, filename ):
    return send_from_directory( SOUNDS_PATH + '/' + folder, filename )

if __name__ == '__main__':
    app.run( debug=True )