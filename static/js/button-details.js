// Function to show button details
function showButtonDetails( index ) {
    const button = buttons[index];

    const buttonDetails = document.getElementById( 'button-details' );
    const buttonTitle = document.getElementById( 'button-title' );
    const buttonName = buttons[activeButtonIndex].name
    const soundList = document.getElementById( 'soundList' );

    buttonTitle.innerText = `${button.name || `Button ${index + 1}`}`;
    buttonName.value = button.name;

    soundList.innerHTML = '';
    button.sounds.forEach( ( sound, idx ) => {
        const listItem = document.createElement( 'li' );
        listItem.innerText = sound;
        listItem.className = 'sound-item';
        listItem.dataset.index = idx; // Store the index in a data attribute
        listItem.addEventListener( 'click', () => playSound( index, idx ) ); // Add click event listener
        soundList.appendChild( listItem );
    } );

    buttonDetails.classList.add( 'active' );
    highlightPlayingSong( index );
}

// Function to load songs from the selected playlist
function loadPlaylist() {
    const playlist = document.getElementById( 'playlist-select' ).value;
    if ( playlist ) {
        buttons[activeButtonIndex].name = playlist
        renderButtons()
        fetch( `/get_songs/${playlist}` )
            .then( response => response.json() )
            .then( songs => {
                const soundList = document.getElementById( 'soundList' );
                soundList.innerHTML = '';
                songs.forEach( ( song, idx ) => {
                    const listItem = document.createElement( 'li' );
                    listItem.innerText = song;
                    listItem.className = 'sound-item';
                    listItem.dataset.index = idx; // Store the index in a data attribute
                    listItem.addEventListener( 'click', () => playSound( currentButtonIndex, idx ) ); // Add click event listener
                    soundList.appendChild( listItem );
                } );
                // Update the current button's sounds
                if ( activeButtonIndex !== null ) {
                    buttons[activeButtonIndex].sounds = songs;
                }
            } );
        handleButtonClick( activeButtonIndex )
        showButtonDetails( activeButtonIndex )
    }
}
// Function to add sound to the list
function addSoundToList( filename ) {
    const soundList = document.getElementById( 'soundList' );
    const listItem = document.createElement( 'li' );
    listItem.innerText = filename;
    listItem.className = 'sound-item';
    soundList.appendChild( listItem );

    if ( activeButtonIndex !== null ) {
        buttons[activeButtonIndex].sounds.push( filename );
    }
}

// Function to highlight the currently playing song
function highlightPlayingSong( index ) {
    const soundItems = document.querySelectorAll( '.sound-item' );
    soundItems.forEach( item => item.classList.remove( 'playing' ) );

    const currentButton = buttons[index];
    const currentSound = lastPlayedSong[index];

    if ( currentButton && currentSound ) {
        soundItems.forEach( item => {
            if ( item.innerText === currentSound ) {
                item.classList.add( 'playing' );
            }
        } );
    }
}
