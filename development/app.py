import base64
import hashlib
import hmac
from pathlib import Path
import platform
import random
import string
import sys
from flask import *
import os
import json
import datetime
import threading
import signal
import time
from cryptography.fernet import Fernet

version = '.0-03-22'

app = Flask( __name__ )

key = b'1001101001-1001101001-1001101001-1001101001='
encrypted = False
authorized = False
trial = False

def get_local_path():

    if platform.system() == "Windows":
        path = Path(os.getenv('LOCALAPPDATA')) / ".DungeonLute"
    elif platform.system() == "Linux":
        path = Path.home() / ".local" / "share" / ".DungeonLute"
    elif platform.system() == "Darwin":
        path = Path.home() / "Library" / "Application Support" / ".DungeonLute"
    else:
        raise Exception( "Unsupported OS" )

    return path


def get_executable_path():
    if getattr(sys, 'frozen', False):
        # If the application is running as a frozen executable
        executable_path = sys.executable
    else:
        # If the application is running in a normal Python environment
        executable_path = os.path.dirname(__file__)

    return os.path.dirname(os.path.abspath(executable_path))

# Paths to directories
PLAYLISTS_PATH = os.path.join( get_executable_path(), 'playlists' )
SOUNDS_PATH = os.path.join( get_executable_path(), 'sfx' )
TRACKS_PATH = os.path.join( get_executable_path(), 'tracks' )
PRESETS_PATH = os.path.join( get_local_path(), 'presets' )
DATA_PATH = os.path.join( get_local_path(), 'data' )

# Home Page
@app.route( '/' )
def index():

    if not authorized:
        return authorize()

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
    presets = []
    json_files = [ f for f in os.listdir( PRESETS_PATH ) if f.endswith( '.json' ) ]

    for preset in json_files:
        name = preset[:-5]
        presets.append( name )

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
    # try:
    with open( os.path.join( DATA_PATH, str(data) + '.json' ), 'r' ) as file:
        var = json.load( file )
    # except FileNotFoundError:
    #     var = []
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

    with open( os.path.join( DATA_PATH, 'color.css' ), 'w' ) as file:
        file.write( '' )
        file.write( '\n'.join(css_rules) )
    return jsonify( {"status": "success"} )

@app.route( '/data/colors.css' )
def load_colors():
    with open( os.path.join( DATA_PATH, 'color.css'), 'rb' ) as file:
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

# ========= #
# USER-AUTH #
# ========= #

def create_salt():

    path = get_local_path()

    path.mkdir(parents=True, exist_ok=True)
    salt = path / version

    if not salt.exists():
        with salt.open('wb') as file:
            f = Fernet( key )
            file.write( f.encrypt( os.urandom( 16 ) ) )

def check_salt():
    path = get_local_path() / version
    return path.exists()

def read_salt():

    _salt = get_local_path() / version

    if _salt.exists():
        with _salt.open('rb') as file:
            f = Fernet( key )
            salt = f.decrypt( file.read() )
    return salt

def hash_username( username ):

    salt = read_salt()
    hmac_hash = hmac.new( key, salt + username.encode(), hashlib.sha256 ).digest()
    base64_hash = base64.urlsafe_b64encode( hmac_hash ).decode( 'utf-8' ).upper()

    random.seed( salt )
    indices = sorted( random.sample( range( 0, len( base64_hash ) - 4 ), 3 ) )

    a = base64_hash[ indices[0]:indices[0] + 4 ]
    b = base64_hash[ indices[1]:indices[1] + 4 ]
    c = base64_hash[ indices[2]:indices[2] + 4 ]

    license = f'{a}-{b}-{c}'
    return license

def authorize():

    date_file = Path( app.root_path ) / 'static' / '.z'
    try:
        with open(date_file, 'rb') as file:
            f = Fernet( key )
            # install_d = datetime.datetime.strptime( f.decrypt( file.read() ).decode(), '%Y-%m-%d').date()
            install_d = datetime.datetime.strptime( file.read().decode(), '%Y-%m-%d').date()

        current_d = datetime.date.today()
        days = abs( ( install_d - current_d ).days )

        if days > 7:
            template = 'auth.html'
            os.remove( date_file )
        else:
            global trial
            trial = True
            template = 'tauth.html'

    except FileNotFoundError:
        template = 'auth.html'

    if encrypted:
        return render_encrypted_template( template )
    else:
        return render_template( template )

@app.route( '/trial' )
def free_trial_pass():

    if trial == True:
        global authorized
        authorized = True

    time.sleep( 0.3 )

    return jsonify( {"status": "success"} )

@app.route( '/login', methods=['POST'] )
def login():
    data = request.json
    username = data['username']
    license = data['license'].upper()

    if license == hash_username( username ):
        global authorized
        authorized = True

    time.sleep( 0.3 )

    return jsonify( {"status": "success"} )

@app.route( '/payment', methods=['POST'] )
def payment():
    data = request.json
    username = data['username']
    license = hash_username( username )

    return jsonify( license )

if __name__ == '__main__':

    if not check_salt():
        # new installation
        create_salt()
        date_file = Path( app.root_path ) / 'static' / '.z'
        with open( date_file, 'wb' ) as file:
            f = Fernet(key)
            # file.write( f.encrypt( datetime.date.today().strftime('%Y-%m-%d').encode() ) )
            file.write( datetime.date.today().strftime('%Y-%m-%d').encode() )

        path = get_local_path()

        data = path / 'data'
        data.mkdir( parents=True, exist_ok=True )
        with open( data / 'color-default.json', 'w' ) as file:
            file.write( '["#ffffff","#292b2c","#343a40","#007bff"]')
        with open( data / 'color.json', 'w' ) as file:
            file.write( '["#ffffff","#292b2c","#343a40","#007bff"]')
        with open( data / 'color.css', 'w' ) as file:
            file.write( '' )

        presets = path / 'presets'
        presets.mkdir( parents=True, exist_ok=True )
        with open( presets / 'Default.json', 'w' ) as file:
            file.write( '[[]]')


    app.run(debug=True)

