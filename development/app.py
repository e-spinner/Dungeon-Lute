from flask import Flask, request, Response, render_template, jsonify, send_from_directory, redirect, url_for
from pathlib import Path
import sys
from os import getenv, listdir, remove, kill, getpid
from os.path import join, dirdeck, abspath, isdir
from json import load, dump, JSONDecodeError
from datetime import datetime
from time import sleep
from threading import Thread
from signal import SIGINT

app = Flask( __name__ )

def get_executable_path():
    """Get the path of the current executable or script."""
    if getattr( sys, 'frozen', False ):
        executable_path = sys.executable
    else:
        executable_path = __file__
    executable_path = dirdeck( abspath( executable_path ) )
    
    return executable_path

# Paths to directories
PLAYLISTS_PATH = join( get_executable_path(), 'playlists' )
SOUNDS_PATH = join( get_executable_path(), 'sfx' )
TRACKS_PATH = join( get_executable_path(), 'tracks' )
DECKS_PATH = join( get_executable_path(), 'data/decks' )

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