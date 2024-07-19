import os
import shutil

# server
shutil.copy( './development/app.py', './.release' )

# html
shutil.copy( './development/templates/edit.html', './.release/templates' )
shutil.copy( './development/templates/index.html', './.release/templates' )
shutil.copy( './development/templates/auth.html', './.release/templates' )
shutil.copy( './development/templates/tauth.html', './.release/templates' )

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
shutil.copy( './development/static/css/styles.css', './.release/static/css' )

# js
cjs = ''
scripts = [ './development/static/js/index/soundboard.js', './development/static/js/index/menu-bar.js', './development/static/js/index/details.js', './development/static/js/util.js', './development/static/js/edit/edit.js' ]

for script in scripts:
    with open(script, 'r') as f:
        js = f.read()
        cjs += js + '\n'

with open('./.release/static/js/scripts.js', 'w') as f:
    f.write(cjs)
    
# pyinstaller
import PyInstaller.__main__

PyInstaller.__main__.run([
    './.release/app.py',
    '--onefile',
    '--name', 'Dungeon Lute',
    '--distpath', './production',
    '--add-data', './.release/static/css/*:static/css',
    '--add-data', './.release/static/js/*:static/js',
    '--add-data', './.release/templates/*:templates',
    '--noconfirm',
    '--contents-directory', '.internal'
])

os.remove( './.release/Dungeon Lute.spec')
shutil.move( './Dungeon Lute.spec', './.release/' )
shutil.rmtree( './.release/build')
shutil.move( './build', './.release/')