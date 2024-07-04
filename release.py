import os
import shutil
import subprocess
import json
import re

# server
shutil.copy( './app.py', './.release' )

# wipe program data
shutil.rmtree( './.release/static/presets')
shutil.rmtree( './.release/static/data')
os.mkdir( './.release/static/presets')
os.mkdir( './.release/static/data')

# default color
shutil.copy( './static/data/color-default.json', './.release/static/data/color.json' )
shutil.copy( './static/presets/Default.json', './.release/static/presets/Default.json' )

# html
shutil.copy( './templates/edit.html', './.release/templates' )
shutil.copy( './templates/index.html', './.release/templates' )

# replace html <script>
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
shutil.copy( './static/css/styles.css', './.release/static/css' )

# js
cjs = ''
scripts = [ './static/js/index/soundboard.js', './static/js/index/menu-bar.js', './static/js/index/details.js', './static/js/util.js', './static/js/edit/edit.js' ]

for script in scripts:
    with open(script, 'r') as f:
        js = f.read()
        cjs += js + '\n'

with open('./.release/static/js/scripts.js', 'w') as f:
    f.write(cjs)
    
# compress js 
subprocess.run([
    'uglifyjs', './.release/static/js/scripts.js', 
    '-o', './.release/static/js/scripts.js', 
    '-c', 
    '-m',
    '--compress', 'passes=3,inline=true,pure_funcs=["log"]'
    ], check=True)

import PyInstaller.__main__

PyInstaller.__main__.run([
    './.release/app.py',
    '--onefile',
    '--name', 'Dungeon Lute',
    '--distpath', './.dist',
    '--add-data', './.release/static/css/*:static/css',
    '--add-data', './.release/static/js/*:static/js',
    '--add-data', './.release/static/data/*:static/data',
    '--add-data', './.release/static/presets/*:static/presets',
    '--add-data', './.release/templates/*:templates',
    '--add-data', './.release/music/Underground/*:static/musi/underground',
    '--noconfirm'
])

os.remove( './.dist/Dungeon Lute.spec')
shutil.move( './Dungeon Lute.spec', './.dist/' )
shutil.rmtree( './.dist/build')
shutil.move( './build', './.dist/')