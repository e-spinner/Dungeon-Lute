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

function openMenu( menu ) {
    animateButton(`${menu}-open`)
    document.getElementById(`${menu}-menu`).style.width = '100%';    
    document.getElementById(`${menu}`).classList.add('active');
}

function closeMenu( menu ) {
    animateButton(`${menu}-close`)
    document.getElementById(`${menu}-menu`).style.width = "0%";    
    document.getElementById(`${menu}`).classList.remove('active');
}

function animateButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.classList.add("clicked");
  setTimeout(() => {
    button.classList.remove("clicked");
  }, 300);
}
