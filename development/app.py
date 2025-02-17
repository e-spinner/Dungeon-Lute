from flask import Flask, request, Response, render_template, jsonify, send_from_directory, redirect, url_for
from pathlib import Path
import sys
from os import getenv, listdir, remove, kill, getpid, walk
from os.path import join, abspath, isdir, dirname
from json import load, dump, JSONDecodeError
from datetime import datetime
from time import sleep
from threading import Thread
from signal import SIGINT

app = Flask( __name__, template_folder='data/templates', static_folder='data/static' )

def get_executable_path():
    """Get the path of the current executable or script."""
    if getattr( sys, 'frozen', False ):
        executable_path = sys.executable
    else:
        executable_path = __file__
    
    return dirname( abspath( executable_path ) )

# Paths to directories
PLAYLISTS_PATH = join( get_executable_path(), 'playlists'  )
SOUNDS_PATH    = join( get_executable_path(), 'sfx'        )
TRACKS_PATH    = join( get_executable_path(), 'tracks'     )
DECKS_PATH     = join( get_executable_path(), 'data/decks' )

@app.route( '/' )
def index():
    """Render the main page."""
    s_log( 'index', 'Rendering main page' )
    return render_template( 'index.html' )

@app.route( '/edit' )
def edit():
    """Render the edit page."""
    s_log( 'edit', 'Switching to edit page' )
    return render_template( 'edit.html' )

# =============== #
# DECK MANAGEMENT #
# =============== #

@app.route( '/save/<deck>', methods=['POST'] )
def save_deck( deck ):
    """Save the current setup as a deck."""
    data = request.json
    sound_board = data['soundBoard']
    css_rules = data['cssRules']
    
    with open( join( DECKS_PATH, str( deck ) + '.json' ), 'w' ) as file:
        file.write( '' )
        dump( sound_board, file )
        
    s_log( 'edit', f'deck {deck} saved' )
    return jsonify( {'status': 'success'} )

@app.route( '/load' )
def get_decks():
    """Return a list of available decks."""
    decks = []
    json_files = [f for f in listdir( DECKS_PATH ) if f.endswith( '.json' )]
    
    for deck in json_files:
        deck = deck[:-5]
        decks.append( deck )
        
    s_log( 'menu-bar', f'decks loaded: {decks}' )
    return jsonify( decks )

@app.route( '/load/<deck>' )
def get_deck( deck ):
    """Return the contents of a specific deck file."""
    try:
        with open( join( DECKS_PATH, str( deck ) + '.json' ), 'r' ) as file:
            playlists = load( file )
        s_log( 'menu-bar', f'deck {deck} loaded successfully' )
        
    except FileNotFoundError:
        playlists = []
        s_log( 'menu-bar', f'deck {deck} not found' )
        
    return jsonify( playlists )

@app.route( '/del/<deck>' )
def del_deck( deck ):
    """Delete a specific deck file."""
    try:
        remove( join( DECKS_PATH, f'{deck}.json' ) )
        s_log( 'menu-bar', f'deck {deck} deleted successfully' )
        return jsonify( {'message': 'deck file deleted successfully'} ), 200
    
    except FileNotFoundError:
        s_log( 'menu-bar', f'deck {deck} not found for deletion' )
        return jsonify( {'error': 'deck file not found'} ), 404
    
    except PermissionError:
        s_log( 'menu-bar', f'Permission denied when deleting deck {deck}' )
        return jsonify( {'error': 'Permission denied'} ), 403

# ========== #
# SOUNDBOARD #
# ========== #
        
@app.route( '/media/<folder>/' )
@app.route( '/media/<folder>/<item>/' )
@app.route( '/media/<folder>/<item>/<sub>/' )
def list_media( folder, item=None, sub=None ):

    _config = {
        'playlist': {'path': PLAYLISTS_PATH, 'extensions': ['.mp3', '.txt']},
        'track':    {'path': TRACKS_PATH,    'extensions': ['.mp3', '.txt']},
        'sound':    {'path': SOUNDS_PATH,    'extensions': ['.mp3', '.wav', '.txt']}
    }
    
    # Validate folder type
    if folder not in _config:
        return jsonify( {'error': 'Invalid folder type'} ), 400
    
    config = _config[folder]
    path = config['path'] if sub == None else config['path'] + '/' + sub 
    
    # Handle listing requests (when item is None)
    if item is None:
        items = [
            i for i in listdir( path )
            if isdir( path  + '/' + i ) or 
               any( i.endswith( ext ) for ext in config['extensions'] )
        ]
        s_log( 'soundboard', f'{folder.capitalize()}s loaded: {items}' )
        return jsonify( items )
    
    # Handle file requests
    
    print(path, item)
        
    s_log( 'soundboard', f"{folder.capitalize()} requested: {item}" )
    return send_from_directory( path, item )


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
    
    s_log( 'driver', f'script path found: {get_executable_path()}' )
    
    s_log( 'driver', 'running flask app' )
    app.run( debug=True )