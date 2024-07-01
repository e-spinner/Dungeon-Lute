// static/js/utils.js


// log

let debug_mode = true

function log( origin, message ) {

    if ( debug_mode == true ) {
        fetch( '/log', {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( {origin: origin, message: message} )
        })
    }
}

// transfer to edit page to build playlists
function edit() {
    log( 'util', 'loading edit.html' )
    window.location.href = '/edit'
}

function animateButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.classList.add("clicked");
  setTimeout(() => {
    button.classList.remove("clicked");
  }, 300);
}
