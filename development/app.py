from flask import Flask, request, Response, render_template, jsonify, send_from_directory, redirect, url_for
from pathlib import Path
import sys
from os import getenv, listdir, remove, kill, getpid
from os.path import join, dirname, abspath, isdir
from json import load, dump, JSONDecodeError
from datetime import datetime
from time import sleep
from threading import Thread
from signal import SIGINT

app = Flask( __name__ )

def get_local_path():
    """Determine the local path based on the operating system."""
    if sys.platform == 'win32':
        path = Path( getenv( 'LOCALAPPDATA' ) ) / '.DungeonLute'
    elif sys.platform == 'linux':
        path = Path.home() / '.local' / 'share' / '.DungeonLute'
    elif sys.platform == 'darwin':
        path = Path.home() / 'Library' / 'Application Support' / '.DungeonLute'
    else:
        raise Exception( 'Unsupported OS' )
    
    return path

def get_executable_path():
    """Get the path of the current executable or script."""
    if getattr( sys, 'frozen', False ):
        executable_path = sys.executable
    else:
        executable_path = __file__
    executable_path = dirname( abspath( executable_path ) )
    
    return executable_path

# Paths to directories
PLAYLISTS_PATH = join( get_executable_path(), 'playlists' )
SOUNDS_PATH = join( get_executable_path(), 'sfx' )
TRACKS_PATH = join( get_executable_path(), 'tracks' )
PRESETS_PATH = join( get_local_path(), 'presets' )
DATA_PATH = join( get_local_path(), 'data' )
TEMPLATES_PATH = join( get_executable_path(), 'templates' )

from flask import render_template_string
import pypugjs

def pug_renderer( template_name ):
    with open( f'{TEMPLATES_PATH}/{template_name}.pug' ) as f:
        pug_content = f.read()
    return render_template_string( pypugjs.html.process_pugjs( pug_content, basedir=TEMPLATES_PATH ) )

@app.route( '/' )
def index():
    """Render the main page."""
    s_log( 'index', 'Rendering main page' )
    return pug_renderer( 'index' )

# ======== #
# MENU-BAR #
# ======== #

@app.route( '/load' )
def get_presets():
    """Return a list of available presets."""
    presets = []
    json_files = [f for f in listdir( PRESETS_PATH ) if f.endswith( '.json' )]
    
    for preset in json_files:
        name = preset[:-5]
        presets.append( name )
        
    s_log( 'menu-bar', f'Presets loaded: {presets}' )
    return jsonify( presets )

@app.route( '/load/<preset>' )
def get_preset( preset ):
    """Return the contents of a specific preset file."""
    try:
        with open( join( PRESETS_PATH, str( preset ) + '.json' ), 'r' ) as file:
            playlists = load( file )
        s_log( 'menu-bar', f'Preset {preset} loaded successfully' )
        
    except FileNotFoundError:
        playlists = []
        s_log( 'menu-bar', f'Preset {preset} not found' )
        
    return jsonify( playlists )

@app.route( '/del/<preset>' )
def del_preset( preset ):
    """Delete a specific preset file."""
    try:
        remove( join( PRESETS_PATH, f'{preset}.json' ) )
        s_log( 'menu-bar', f'Preset {preset} deleted successfully' )
        return jsonify( {'message': 'Preset file deleted successfully'} ), 200
    
    except FileNotFoundError:
        s_log( 'menu-bar', f'Preset {preset} not found for deletion' )
        return jsonify( {'error': 'Preset file not found'} ), 404
    
    except PermissionError:
        s_log( 'menu-bar', f'Permission denied when deleting preset {preset}' )
        return jsonify( {'error': 'Permission denied'} ), 403

# ========== #
# SOUNDBOARD #
# ========== #

@app.route( '/playlists' )
def get_playlists():
    """Return a list of available playlists."""
    playlists = [dir for dir in listdir( PLAYLISTS_PATH ) if isdir( join( PLAYLISTS_PATH, dir ) )]
    
    s_log( 'soundboard', f'Playlists loaded: {playlists}' )
    return jsonify( playlists )

@app.route( '/song/<playlist>' )
def get_songs( playlist ):
    """Return a list of songs in a specific playlist."""
    playlist_path = join( PLAYLISTS_PATH, playlist )
    songs = [file for file in listdir( playlist_path ) if file.endswith( '.mp3' )]
    
    s_log( 'soundboard', f'Songs in playlist {playlist} loaded: {songs}' )
    return jsonify( songs )

@app.route( '/song/<playlist>/<song>' )
def get_song( playlist, song ):
    """Return a specific song file."""
    
    s_log( 'soundboard', f'Song requested: {song} from playlist {playlist}' )
    return send_from_directory( PLAYLISTS_PATH + '/' + playlist, song )

@app.route( '/track' )
def get_tracks():
    """Return a list of available tracks."""
    tracks = [track for track in listdir( TRACKS_PATH ) if track.endswith( '.mp3' )]
    
    s_log( 'soundboard', f'Tracks loaded: {tracks}' )
    return jsonify( tracks )

@app.route( '/track/<track>' )
def get_track( track ):
    """Return a specific track file."""
    
    s_log( 'soundboard', f'Track requested: {track}' )
    return send_from_directory( TRACKS_PATH, track )

@app.route( '/sound' )
def get_sounds():
    """Return a list of available sounds."""
    sounds = [sound for sound in listdir( SOUNDS_PATH ) if sound.endswith( '.mp3' ) or sound.endswith( '.wav' )]
    
    s_log( 'soundboard', f'Sounds loaded: {sounds}' )
    return jsonify( sounds )

@app.route( '/sound/<sound>' )
def get_sound( sound ):
    """Return a specific sound file."""
    
    s_log( 'soundboard', f'Sound requested: {sound}' )
    return send_from_directory( SOUNDS_PATH, sound )

# ========= #
# UTILITIES #
# ========= #

@app.route( '/log', methods=['POST'] )
def log():
    """Log client messages to the terminal."""
    data = request.get_json()
    origin = data['origin']
    message = data['message']
    timestamp = datetime.now().strftime( '%d/%b/%Y %H:%M:%S' )
    
    print( f'\033[34m{request.remote_addr} - - [{timestamp}][{origin.upper()}]: {message}\033[0m' )
    return jsonify( {'status': 'success'} )

def s_log( origin, message ):
    """Log server messages to the terminal."""
    timestamp = datetime.now().strftime( '%d/%b/%Y %H:%M:%S' )
    print( f'\033[31mPY-SERVER - - [{timestamp}][{origin.upper()}]: {message}\033[0m' )
    
    
@app.route( '/save/data/<data>', methods=['POST'] )
def save_data( data ):
    """Save JSON data to a file."""
    var = request.json
    
    with open( join( DATA_PATH, str( data ) + '.json' ), 'w' ) as file:
        file.write( '' )
        dump( var, file )
        
    s_log( 'utilities', f'Data saved to {data}.json' )
    return jsonify( {'status': 'success'} )

@app.route( '/load/data/<data>' )
def load_data( data ):
    """Load JSON data from a file."""
    try:
        with open( join( DATA_PATH, str( data ) + '.json' ), 'r' ) as file:
            var = load( file )
        s_log( 'utilities', f'Data loaded from {data}.json' )
        
    except FileNotFoundError:
        var = []
        s_log( 'utilities', f'Data file {data}.json not found' )
        
    except JSONDecodeError:
        var = []
        s_log( 'utilities', f'Error decoding JSON from file {data}.json' )
        
    return jsonify(var)

# ==== #
# EDIT #
# ==== #

@app.route( '/edit' )
def edit():
    """Render the edit page and clear the colors.css file."""
    
    with open( join( app.root_path, 'static', 'css', 'colors.css' ), 'w' ) as file:
        file.write( '' )
    s_log( 'edit', 'Switching to edit page' )
    
    return render_template( 'edit.html' )

@app.route( '/save/<name>', methods=['POST'] )
def save_preset( name ):
    """Save the current setup as a preset."""
    data = request.json
    sound_board = data['soundBoard']
    css_rules = data['cssRules']
    
    with open( join( PRESETS_PATH, str( name ) + '.json' ), 'w' ) as file:
        file.write( '' )
        dump( sound_board, file )
        
    with open( join( DATA_PATH, 'color.css' ), 'w' ) as file:
        file.write( '' )
        file.write( '\n'.join( css_rules ) )
        
    s_log( 'edit', f'Preset {name} saved' )
    return jsonify( {'status': 'success'} )

@app.route( '/data/colors.css' )
def load_colors():
    """Load and return the colors.css file."""
    
    with open( join( DATA_PATH, 'color.css' ), 'rb' ) as file:
        css = file.read()
        
    s_log( 'edit', 'Colors.css loaded' )
    return Response( css.decode( 'utf-8' ), content_type='text/css' )

# ============== #
# SERVER CONTROL #
# ============== #

@app.route( '/stop' )
def stop():
    """Stop the server."""
    Thread( target=shutdown_server ).start()
    
    s_log( 'server-control', 'Server stop requested' )
    return redirect( url_for( 'index' ) )

def shutdown_server():
    """Shut down the server."""
    sleep( 0.4 )
    
    kill( getpid(), SIGINT )
    s_log( 'server-control', 'Server shutting down' )

# ====== #
# DRIVER #
# ====== #

if __name__ == '__main__':
    
    path = get_local_path()
    
    s_log( 'driver', f'local path found: {path}' )
    s_log( 'driver', f'script path found: {get_executable_path()}' )

    if not ( path / 'data' / 'color-default.json' ).exists():
        # new installation
        s_log( 'driver', 'new installation detected' )

        data = path / 'data'
        data.mkdir( parents=True, exist_ok=True )
        
        with open( data / 'color-default.json', 'w' ) as file:
            dump( ['#ffffff', '#292b2c', '#343a40', '#007bff'], file )
        with open( data / 'color.json', 'w' ) as file:
            dump( ['#241f31', '#77767b', '#c0bfbc', '#f66151'], file )
        with open( data / 'color.css', 'w' ) as file:
            file.write( '' )

        presets = path / 'presets'
        presets.mkdir( parents=True, exist_ok=True )
        
        with open( presets / 'Default.json', 'w' ) as file:
            file.write( '[[]]' )

    s_log( 'driver', 'running flask app' )
    app.run( debug=True )