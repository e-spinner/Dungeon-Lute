import os
import shutil
import subprocess
from cryptography.fernet import Fernet

# server
shutil.copy( './development/app.py', './.release' )

# change encrypted to true
with open('./.release/app.py', 'r') as file:
    lines = file.readlines()

for i, line in enumerate(lines):
    if 'encrypted = False' in line:
        lines[i] = 'encrypted = True\n'
        break

with open('./.release/app.py', 'w') as file:
    file.writelines(lines)

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
    
# compress js 
subprocess.run([
    'uglifyjs', './.release/static/js/scripts.js', 
    '-o', './.release/static/js/scripts.js', 
    '-c', 
    '-m',
    '--compress', 'passes=3,inline=true,pure_funcs=["log"]'
    ], check=True)

# encrypt prgm-data
def encrypt_file(file_path, key):
    f = Fernet(key)
    with open(file_path, 'rb') as file:
        file_data = file.read()
    encrypted_data = f.encrypt(file_data)
    with open(file_path, 'wb') as file:
        file.write(encrypted_data)

def encrypt_directory(directory_path, key):
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            encrypt_file(file_path, key)


key = b'1001101001-1001101001-1001101001-1001101001='

encrypt_directory('/home/dev/Programs/soundboard/.release/templates', key)
encrypt_directory('/home/dev/Programs/soundboard/.release/static', key)

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