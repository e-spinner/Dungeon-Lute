from flask import Flask, request, render_template, jsonify, send_from_directory, redirect, url_for
import sys
from os import listdir, remove, kill, getpid
from os.path import join, abspath, isdir, dirname
from json import load, dump
from datetime import datetime
from time import sleep
from threading import Thread
from signal import SIGINT

app = Flask( __name__, template_folder='data/templates', static_folder='data/static' )

def get_executable_path():
    executable_path = sys.executable if getattr( sys, 'frozen', False ) else __file__
    return dirname( abspath( executable_path ) )

CONFIG = {
    'playlist': {'path': join( get_executable_path(), 'playlists'  ), 
                 'extensions': ['.mp3']},
    'track':    {'path': join( get_executable_path(), 'tracks'        ),    
                 'extensions': ['.mp3']},
    'sound':    {'path': join( get_executable_path(), 'sfx'     ),    
                 'extensions': ['.mp3', '.wav']},
    'deck':     {'path': join( get_executable_path(), 'data/decks' ),     
                 'extensions': ['.json']},
    'color':    {'path': join( get_executable_path(), 'data'       ),     
                 'extensions': ['.json']},
}

@app.route( '/' )
def index(): return render_template( 'index.html' )
@app.route( '/edit' )
def edit():  return render_template( 'edit.html'  )

# =============== #
# FILE MANAGEMENT #
# =============== #

@app.route( '/save/<folder>/<item>', methods=['POST'] )
def file_save( folder, item ):
    data = request.json['save']
    
    with open( join( CONFIG[folder]['path'], str( item ) + '.json' ), 'w' ) as file:
        file.write( '' )
        dump( data, file )
        
    s_log( 'file_mngr', f'file: {item} saved' )
    return jsonify( {'status': 'success'} )

@app.route( '/del/<folder>/<item>' )
def file_delete( folder, item ):
    try:
        remove( join( CONFIG[folder]['path'], f'{item}' ) )
        s_log( 'file_mngr', f'file: {item} deleted successfully' )
        return jsonify( {'message': 'file deleted successfully'} ), 200
    
    except FileNotFoundError:
        s_log( 'file_mngr', f'deck {item} not found for deletion' )
        return jsonify( {'error': 'file not found'} ), 404
    
    except PermissionError:
        s_log( 'file_mngr', f'Permission denied when deleting file: {item}' )
        return jsonify( {'error': 'Permission denied'} ), 403
        
@app.route( '/load/<folder>/' )
@app.route( '/load/<folder>/<item>/' )
@app.route( '/load/<folder>/<item>/<sub>/' )
def file_handler( folder, item=None, sub=None ):
    
    # Validate folder type
    if folder not in CONFIG:
        return jsonify( {'error': 'Invalid folder type'} ), 400
    
    config = CONFIG[folder]
    path = config['path'] if sub == None else config['path'] + '/' + sub 
        
    print(path,item)
    
    # Handle listing requests (when item is None)
    if item is None or item == 'None':
        items = [
            i for i in listdir( path )
            if isdir( path  + '/' + i ) or 
               any( i.endswith( ext ) for ext in config['extensions'] )
        ]
        s_log( 'file_mngr', f'{folder}s loaded: {items}' )
        return jsonify( items )
    
    # Handle file requests
    if folder != 'deck':
        s_log( 'file_mngr', f"{folder} requested: {item}" )
        return send_from_directory( path, item )
    
    # Handle deck requests
    else:
        try:
            with open( join( path, str( item ) + '.json' ), 'r' ) as file:
                playlists = load( file )
            s_log( 'file_mngr', f'deck {item} loaded successfully' )
        except FileNotFoundError:
            playlists = []
            s_log( 'file_mngr', f'deck {item} not found' )
            
        return jsonify( playlists )


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

@app.route( '/stop' )
def stop():
    """Stop the server."""
    Thread( target=shutdown_server ).start()
    
    return redirect( url_for( 'index' ) )

def shutdown_server():
    """Shut down the server."""
    sleep( 0.4 )
    kill( getpid(), SIGINT )

# ====== #
# DRIVER #
# ====== #

if __name__ == '__main__':  app.run( debug=True )