// Function to render the buttons on the soundboard
function renderButtons() {
    const soundboard = document.getElementById( 'soundboard' );
    soundboard.innerHTML = '';
    buttons.forEach( ( button, index ) => {
        const btn = document.createElement( 'button' );
        btn.className = 'sound-button';
        btn.innerText = button.name || `Button ${index + 1}`;
        btn.onclick = () => handleButtonClick( index );
        if ( index == activeButtonIndex ) {
            btn.classList.add( 'active' )
        }
        soundboard.appendChild( btn );
    } );

}

// Function to handle button clicks
function handleButtonClick( index ) {
    if ( activeButtonIndex === index ) {
        if ( audio && !audio.paused ) {
            stopCurrentAudio();
            return;
        }
    }
    
    fadeOutAudio().then(() => {
        stopCurrentAudio()

        activeButtonIndex = index;
        playRandomSound( index );
        showButtonDetails( index );
    });
    

}

// Function to stop the current audio
function stopCurrentAudio() {
    if ( audio ) {
        audio.pause();
        audio = null;
    }
    if ( activeButtonIndex !== null ) {
        const buttons = document.querySelectorAll( '.sound-button' );
        buttons[activeButtonIndex].classList.remove( 'active' );
    }
}

// Function to fade out audio
function fadeOutAudio() {
    return new Promise( ( resolve ) => {
        if ( audio ) {
            let volume = audio.volume;
            const fadeOutInterval = setInterval( () => {
                if ( volume > 0.05 ) {
                    volume -= 0.05;
                    audio.volume = Math.max( 0, volume) ;
                } else {
                    clearInterval( fadeOutInterval );
                    audio.volume = 0;
                    resolve();
                }
            }, FADE_OUT_DURATION / 20 );
        } else {
            resolve();
        }
    });
}

// Function to play a specific sound
function playSound( index, soundIndex ) {
    fadeOutAudio().then(() => {
        stopCurrentAudio()
        const buttonName = buttons[activeButtonIndex].name
        const button = buttons[index];
        const sound = button.sounds[soundIndex];
    
        if ( lastPlayedSong[index] != sound ) {
            addToHistory( index, soundIndex ); // Add to history
        }
        lastPlayedSong[index] = sound;
    
        audio = new Audio( `/sounds/${buttonName}/${sound}` );
        audio.play();
        audio.onended = () => playRandomSound( index );
        highlightPlayingSong( index );
    
        const buttonElements = document.querySelectorAll( '.sound-button' );
        buttonElements[index].classList.add( 'active' );
    
    
        let pause = document.getElementById( 'pause_play' );
        pause.innerText = 'Pause';
    });
}

// Function to play a random sound from a button's list
function playRandomSound( index ) {
    const button = buttons[index];
    const buttonName = buttons[activeButtonIndex].name
    if ( button.sounds.length > 0 ) {
        const availableSongs = button.sounds.filter( sound => sound !== lastPlayedSong[index] );
        if ( availableSongs.length === 0 ) {
            availableSongs.push( ...button.sounds );
        }
        const randomIndex = Math.floor( Math.random() * availableSongs.length );
        const sound = availableSongs[randomIndex];

        if ( lastPlayedSong[index] != sound ) {
            addToHistory( index, button.sounds.indexOf( sound ) ); // Add to history
        }
        lastPlayedSong[index] = sound;
        
        audio = new Audio( `/sounds/${buttonName}/${sound}` );
        audio.play();
        audio.onended = () => playRandomSound( index );
        highlightPlayingSong( index );
        
        const buttonElements = document.querySelectorAll( '.sound-button' );
        buttonElements[index].classList.add( 'active' );

        let pause = document.getElementById( 'pause_play' );
        pause.innerText = 'Pause';
    }
}
