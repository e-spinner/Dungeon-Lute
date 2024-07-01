// static/js/index/soundboard.js

document.addEventListener( 'DOMContentLoaded', ( event ) => {

    loadSoundboard( 'Default' );
    loadPresets();
    log( 'soundboard', 'DOMContentLoaded' )
});

// load in the playlists
function loadSoundboard( preset ) {
    log( 'soundboard', 'loading soundboard...' )
    fetch( `/load/${preset}` )
    .then( response => response.json() )
    .then( data => {
        
        const grid = document.getElementById( 'grid' )
        data.forEach( ( row ) => {
            const tr = document.createElement( 'tr' )
            tr.classList.add( 'row' )
            row.forEach( ( playlist ) => {
                const pl = document.createElement( 'td' );
                if ( playlist != 'blank') {
                    pl.classList.add( 'playlist' )
                    pl.innerText = playlist;
                    pl.id = playlist;
                    pl.onclick = () => { 
                        togglePlaylist( playlist );
                        animateButton(playlist);

                    }
                } else {
                    pl.classList.add( 'spacer' );
                }
                tr.appendChild( pl )
            });
            grid.appendChild( tr )
        });
        log( 'soundboard', 'soundboard loaded' )

    });
}

// handle activation / deactivation of a playlist
function togglePlaylist( playlist ) {

    fetch( '/playlists' )
    .then( response => response.json() )
    .then( playlists => {
        const p_idx = Array.from( playlists ).indexOf( playlist )

        if ( playingIndex == p_idx ) {
            if ( audio && !audio.paused ) {
                stopCurrentSong();
                const details = document.getElementById( 'details' );
                details.classList.remove( 'playing' );                
                const pl_ids = document.querySelectorAll( '.playlist' ) ;
                pl_ids.forEach( ( id ) => {
                    if ( id.innerText == playlists[p_idx] ) {
                        id.classList.remove( 'playing' )
                    }
                });
                log( 'soundboard', `stopped playlist: ${p_idx}` );
                return;
            }
        }
        log( 'soundboard', `starting playlist: ${p_idx}` );

        fadeOutSong().then( () => {
            stopCurrentSong()

            playingIndex = p_idx
            playRandomSong( p_idx )
            showPlaylist( p_idx )
        });
    });
}

// stop currently playing song
function stopCurrentSong() {
    if ( audio ) {
        audio.pause();
        audio = null;
    }
    if ( playingIndex !== null ) {             
                const pl_ids = document.querySelectorAll( '.playlist' ) ;
                pl_ids.forEach( ( id ) => {

                    id.classList.remove( 'playing' )

                });
    }
    log( 'soundboard', 'stopping current song' )
}

// fade out currently playing song
function fadeOutSong() {
    return new Promise( ( resolve ) => {
        if ( audio ) {
            let volume = audio.volume;
            const fadeOutInterval = setInterval( () => {
                if ( volume > 0.05 ) {
                    volume -= 0.05;
                    audio.volume = Math.max( 0, volume )
                } else {
                    clearInterval( fadeOutInterval );
                    audio.volume = 0;
                    log( 'soundboard', 'current audio has beed faded out')
                    resolve()
                }
            }, FADE_OUT_DURATION / 20 );
        } else {
            log( 'soundboard', 'there is no audio to fade out')
            resolve();
        }
    });
}

// play a specific song from a specific playlist
function playSong( p_idx, s_idx ) {
    fadeOutSong().then( () => {
        stopCurrentSong();
        
        fetch( '/playlists' )
        .then( response => response.json() )
        .then( playlists => {
            const playlist = playlists[p_idx];
    
            fetch( `/song/${playlist}` )
            .then( response => response.json() )
            .then( songs => {
                const song = songs[s_idx]

                if ( lastPlayedSong[p_idx] != song ) {
                    addToHistory( p_idx, s_idx );
                }
                lastPlayedSong[p_idx] = song;

                audio = new Audio( `/song/${playlist}/${song}` );
                audio.play();
                audio.onended = () => playRandomSong( p_idx );
                highlightPlayingSong( p_idx );

                const pl_ids = document.querySelectorAll( '.playlist' ) ;
                pl_ids.forEach( ( id ) => {
                    if ( id.innerText == playlist ) {
                        id.classList.add( 'playing' )
                    }
                });

                
                let audio_status = document.getElementById( 'pause_play' )
                audio_status.classList.remove( 'fa-play' )
                audio_status.classList.add( 'fa-pause' )
                log( 'soundboard', `specifically playing ${p_idx}, ${s_idx}` )
            });
        });
    });
}

// play a random song from a specific playlist
function playRandomSong( p_idx ) {

    fetch( '/playlists' )
    .then( response => response.json() )
    .then( playlists => {
        const playlist = playlists[p_idx];

        fetch( `/song/${playlist}` )
        .then( response => response.json() )
        .then( songs => {

            if ( songs.length > 0 ) {
                const availableSongs = songs.filter( song => song !== lastPlayedSong[p_idx] );
                if ( availableSongs.length === 0 ) {
                    availableSongs.push( ...songs );
                }

                const s_idx = Math.floor( Math.random() * availableSongs.length );
                const song = availableSongs[s_idx];

                if ( lastPlayedSong[p_idx] != song ) {
                    addToHistory( p_idx, s_idx );
                }
                lastPlayedSong[p_idx] = song;

                audio = new Audio( `/song/${playlist}/${song}` );
                audio.play();
                audio.onended = () => playRandomSong( p_idx );
                highlightPlayingSong( p_idx );

                const pl_ids = document.querySelectorAll( '.playlist' ) ;
                pl_ids.forEach( ( id ) => {
                    if ( id.innerText == playlist ) {
                        id.classList.add( 'playing' )
                    }
                });

                
                let audio_status = document.getElementById( 'pause_play' )
                audio_status.classList.remove( 'fa-play' )
                audio_status.classList.add( 'fa-pause' )
                log( 'soundboard', `randomly playing ${p_idx}, ${s_idx}` )
   
            }
        });
    });

}
