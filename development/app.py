from flask import *
import os
import json
import datetime
import threading
import signal
import time
from cryptography.fernet import Fernet

app = Flask( __name__ )

key = b'1001101001-1001101001-1001101001-1001101001='
encrypted = False

# Paths to directories
PLAYLISTS_PATH = os.path.join( os.path.dirname(app.root_path), 'playlists' )
SOUNDS_PATH = os.path.join( os.path.dirname(app.root_path), 'sfx' )
TRACKS_PATH = os.path.join( os.path.dirname(app.root_path), 'tracks' )
PRESETS_PATH = os.path.join( app.root_path, 'presets' )
DATA_PATH = os.path.join( app.root_path, 'data' )

# Home Page
@app.route( '/' )
def index():
    if encrypted:
        return render_encrypted_template( 'index.html' )
    else:
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
    json_files = [ f for f in os.listdir( PRESETS_PATH ) if f.endswith( '.json' ) ]
    
    # Extract the names of the presets by removing the.json extension
    for preset in json_files:
        name = preset[:-5]  # Remove the.json extension
        presets.append( name )
    
    # Return the list of preset names
    return jsonify( presets )
    
# Request for preset.json
@app.route( '/load/<preset>' )
def get_preset( preset ):
    try:
        with open( os.path.join( PRESETS_PATH, str(preset) + '.json' ), 'r' ) as file:
            playlists = json.load( file )
    except FileNotFoundError:
        playlists = []
    return jsonify( playlists )  
    
# Request deletion of a preset
@app.route( '/del/<preset>')
def del_preset( preset ) :
    try:
        os.remove(os.path.join(PRESETS_PATH, f'{preset}.json'))
        return jsonify({"message": "Preset file deleted successfully"}), 200
    except FileNotFoundError:
        return jsonify({"error": "Preset file not found"}), 404
    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403

# ========== #
# SOUNDBOARD #
# ========== #
  
# Request current list of playlists
@app.route( '/playlists' )
def get_playlists():
    playlists = [ dir for dir in os.listdir( PLAYLISTS_PATH ) if os.path.isdir( os.path.join( PLAYLISTS_PATH, dir ) ) ]
    return jsonify( playlists )

# Request list of songs in  a playlist
@app.route( '/song/<playlist>' )
def get_songs( playlist ):
    playlist_path = os.path.join( PLAYLISTS_PATH, playlist )
    songs = [file for file in os.listdir( playlist_path ) if file.endswith( '.mp3' )]
    return jsonify( songs )

# Request song
@app.route( '/song/<playlist>/<song>' )
def get_song( playlist, song ):
    return send_from_directory( PLAYLISTS_PATH + '/' + playlist, song )

# Request current list of tracks
@app.route( '/track')
def get_tracks():
    tracks = [track for track in os.listdir( TRACKS_PATH ) if track.endswith( '.mp3' )]
    return jsonify(tracks)

# Request track
@app.route( '/track/<track>' )
def get_track( track ):
    return send_from_directory( TRACKS_PATH, track )

# Request current list of sounds
@app.route( '/sound')
def get_sounds():
    sounds = [sound for sound in os.listdir( SOUNDS_PATH ) if sound.endswith( '.mp3' )]
    return jsonify(sounds)

# Request sound
@app.route( '/sound/<sound>' )
def get_sound( sound ):
    return send_from_directory( SOUNDS_PATH, sound )

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

# save data to <data>.json
@app.route( '/save/data/<data>', methods=['POST'] )
def save_data( data ):
    var = request.json
    with open( os.path.join( DATA_PATH, str(data) + '.json' ), 'w' ) as file:
        file.write( '' )
        json.dump( var, file )
    return jsonify( {"status": "success"} )
    
# request data from <data>.json
@app.route( '/load/data/<data>' )
def load_data( data ):
    try:
        with open( os.path.join( DATA_PATH, str(data) + '.json' ), 'r' ) as file:
            var = json.load( file )
    except FileNotFoundError:
        var = []
    return jsonify( var ) 


# ==== #
# EDIT #
# ==== #

# switch to edit page
@app.route( '/edit' )
def edit():
    with open( os.path.join( app.root_path, 'static', 'css', 'colors.css' ), 'w' ) as file:
        file.write( '' )
        
    if encrypted:
        return render_encrypted_template( 'edit.html' )
    else:
        return render_template( 'edit.html' )  

# Save current setup to <name>.json
@app.route( '/save/<name>', methods=['POST'] )
def save_preset( name ):
    data = request.json
    sound_board = data['soundBoard']
    css_rules = data['cssRules']
    with open( os.path.join( PRESETS_PATH, str(name) + '.json' ), 'w' ) as file:
        file.write( '' )
        json.dump( sound_board, file )
        
    with open( os.path.join( app.root_path, 'data', 'colors.css' ), 'w' ) as file:
        file.write( '' )
        file.write( '\n'.join(css_rules) )
    return jsonify( {"status": "success"} )

@app.route( '/data/colors.css' )
def load_colors():
    with open( os.path.join( app.root_path, 'data', 'colors.css'), 'rb' ) as file:
        css = file.read()
    return Response( css.decode( "utf-8" ), content_type='text/css' )   

# ============== #
# SERVER CONTROl #
# ============== #

@app.route( '/stop' )
def stop():
    threading.Thread( target=shutdown_server ).start()
    return redirect( url_for( 'index' ) )

def shutdown_server():
    
    time.sleep( 0.4 )
    os.kill( os.getpid(), signal.SIGINT )
    
@app.route( '/info' )
def info():
    return PLAYLISTS_PATH

# ========== #
# ENCRYPTION #
# ========== #

def decrypt_file( file_path, key ):
    f = Fernet( key )
    with open( file_path, 'rb' ) as file:
        encrypted_data = file.read()
    decrypted_data = f.decrypt( encrypted_data )
    return decrypted_data.decode( "utf-8" )

@app.route( '/static/<dir>/<file>')
def serve_static_file( dir, file ):
    file_path = os.path.join( app.root_path, 'static', dir, file )
    
    if encrypted:
        if os.path.exists( file_path ):
            decrypted_data = decrypt_file( file_path, key )

            mime_type = 'text/css' if file.endswith( '.css' ) else 'application/javascript'
            return Response( decrypted_data, content_type=mime_type )
        else:
            abort( 404 )
    
    else:  
        if os.path.exists( file_path ):
            with open( file_path, 'rb' ) as f:
                mime_type = 'text/css' if file.endswith( '.css' ) else 'application/javascript'
                return Response( f.read(), content_type=mime_type )
        
def render_encrypted_template( template_name, **context ):
    file_path = os.path.join( app.root_path, 'templates', template_name )
    if os.path.exists( file_path ):
        decrypted_data = decrypt_file( file_path, key )
        return render_template_string( decrypted_data, **context )
    else:
        abort( 404 )

if __name__ == '__main__':
    
    app.run( debug=True )
    
