import os
import shutil
import zipfile
import argparse

import PyInstaller.__main__

# argument parser
parser = argparse.ArgumentParser(description='Package application for release.')
parser.add_argument('-d', '--destination', type=str, required=True, help='Destination directory for the release')
parser.add_argument('-z', '--zip', action='store_true', help='Whether to zip the output (default: False)')
args = parser.parse_args()

# ========== #
# PARAMETERS #
# ========== #

RELEASE_DESTINATION = args.destination
ZIP_OUTPUT = args.zip

# setup
os.makedirs( './.release/static/css', exist_ok=True )
os.makedirs( './.release/static/js', exist_ok=True )
os.makedirs( './.release/templates', exist_ok=True )

# server
shutil.copy( './development/app.py', './.release' )

# html
shutil.copy( './development/templates/edit.html', './.release/templates' )
shutil.copy( './development/templates/index.html', './.release/templates' )

# replace html <script> with one file
with open( './.release/templates/index.html', 'r' ) as file:
    content = file.read()
    js_start = content.find( '<!-- JS-START -->' )
    js_end = content.find( '<!-- JS-END -->' )
with open( './.release/templates/index.html', 'w' ) as file:
    file.write( content[:js_start] + '<script src=\"{{ url_for(\'static\', filename=\'js/scripts.js\') }}\"></script>' + content[js_end+15:] )
    
with open( './.release/templates/edit.html', 'r' ) as file:
    content = file.read()
    js_start = content.find( '<!-- JS-START -->' )
    js_end = content.find( '<!-- JS-END -->' )
with open( './.release/templates/edit.html', 'w' ) as file:
    file.write( content[:js_start] + '<script src=\"{{ url_for(\'static\', filename=\'js/scripts.js\') }}\"></script>' + content[js_end+15:] )
 
# css
shutil.copy( './development/static/css/styles.css', './.release/static/css' )

# js
cjs = ''
scripts = [ './development/static/js/soundboard.js', './development/static/js/soundeffect.js', './development/static/js/menu-bar.js', './development/static/js/details.js', './development/static/js/util.js', './development/static/js/edit.js' ]

for script in scripts:
    with open( script, 'r' ) as f:
        js = f.read()
        cjs += js + '\n'

with open( './.release/static/js/scripts.js', 'w' ) as f:
    f.write( cjs )
    
# pyinstaller
PyInstaller.__main__.run([
    './.release/app.py',
    '--onefile',
    '--name', 'Dungeon Lute',
    '--distpath', './Dungeon-Lute',
    '--add-data', './.release/static/css/*:static/css',
    '--add-data', './.release/static/js/*:static/js',
    '--add-data', './.release/templates/*:templates',
    '--noconfirm',
    '--contents-directory', '.internal'
])

# Cleanup
shutil.rmtree( './.release' )
os.remove( './Dungeon Lute.spec' )
shutil.rmtree( './build' )

os.makedirs( './Dungeon-Lute/playlists', exist_ok=True )
os.makedirs( './Dungeon-Lute/tracks', exist_ok=True )
os.makedirs( './Dungeon-Lute/sfx', exist_ok=True )

shutil.copy( './development/playlists/.gitkeep', './Dungeon-Lute/playlists' )
shutil.copy( './development/tracks/.gitkeep', './Dungeon-Lute/tracks' )
shutil.copy( './development/sfx/.gitkeep', './Dungeon-Lute/sfx' )

shutil.copy( './assets/readme.txt', './Dungeon-Lute' )
shutil.copy( './LICENSE', './Dungeon-Lute')

if ZIP_OUTPUT:

    # zip  release
    def zip_folder( folder_path, zip_name ):
        with zipfile.ZipFile( zip_name, 'w', zipfile.ZIP_DEFLATED ) as zipf:
            for root, dirs, files in os.walk( folder_path ):
                for file in files:
                    file_path = os.path.join( root, file )
                    zipf.write( file_path, os.path.relpath( file_path, os.path.join( folder_path, '..' ) ) )

    zip_folder( './Dungeon-Lute', f'./zip' )
    shutil.move( f'./zip', f'{RELEASE_DESTINATION}' )
    shutil.rmtree( './Dungeon-Lute' )
    
else:
    os.rename( './Dungeon-Lute', f'./prgm' )
    shutil.move( f'./prgm', f'{RELEASE_DESTINATION}' )
