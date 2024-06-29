// static/js/index/soundboard.js

let preset = 'default'

document.addEventListener( 'DOMContentLoaded', ( event ) => {

    loadSoundboard( preset );
    log( 'soundboard', 'DOMContentLoaded' )
});

// load in the playlists
function loadSoundboard( preset ) {
    log( 'soundboard', 'loading soundboard...' )
    fetch( `/load/${preset}` )
    .then( response => response.json() )
    .then( data => {
        playlists = data;

        const soundboard = document.getElementById( 'soundboard' )
        playlists.forEach( ( playlist, p_idx ) => {
            const pl = document.createElement( 'button' );
            pl.className = 'playlist';
            pl.innerText = playlist.name ;
            pl.onclick = () => togglePlaylist( p_idx );
            soundboard.appendChild( pl )
        });
        log( 'soundboard', 'soundboard loaded' )

    });
}

// handle activation / deactivation of a playlisy
function togglePlaylist( p_idx ) {
    if ( playingIndex = p_idx ) {
        if ( audio && !audio.paused ) {
            stopCurrentSong();
            const details = document.getElementById( 'details' );
            details.classList.remove( 'active' );
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
}

// stop currently playing song
function stopCurrentSong() {
    if ( audio ) {
        audio.pause();
        audio = null;
    }
    if ( playingIndex !== null ) {
        const playlistss = document.querySelectorAll( '.playlist' )
        playlistss[playingIndex].classList.remove( 'playing' )
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
        
        const playlistName = playlists[playingIndex].name;
        const playlist = playlists[p_idx];
        const song = playlist.songs[s_idx];

        if ( lastPlayedSong[p_idx] != song ) {
            addToHistory( p_idx, s_idx );
        }
        lastPlayedSong[p_idx] = song;

        audio = new Audio( `/song/${playlistName}/${song}` );
        audio.play();
        audio.onended = () => playRandomSong( p_idx );
        highlightPlayingSong( p_idx );

        const playlistss = document.querySelectorAll( '.playlist' ) ;
        playlistss[ p_idx ].classList.add( ' playing' );

        
        let audio_status = document.getElementById( 'pause_play' )
        audio_status.classList.remove( 'fa-play' )
        audio_status.classList.add( 'fa-pause' )
        log( 'soundboard', `specifically playing ${p_idx}, ${s_idx}` )
    });
}

// play a random song from a specific playlist
function playRandomSong( p_idx ) {
    const playlistName = playlists[playingIndex].name;
    const playlist = playlists[p_idx];

    if ( playlist.songs.length > 0 ) {
        const availableSongs = playlist.filter( song => song !== lastPlayedSong[p_idx] );
        if ( availableSongs.length === 0 ) {
            availableSongs.push( ...playlist.songs );
        }

        const s_idx = Math.floor( Math.random() * availableSongs.length );
        const song = availableSongs[s_idx];

        if ( lastPlayedSong[p_idx] != song ) {
            addToHistory( p_idx, s_idx );
        }
        lastPlayedSong[p_idx] = song;

        audio = new Audio( `/song/${playlistName}/${song}` );
        audio.play();
        audio.onended = () => playRandomSong( p_idx );
        highlightPlayingSong( p_idx );

        const playlistss = document.querySelectorAll( '.playlist' ) ;
        playlistss[ p_idx ].classList.add( ' playing' );

        
        let audio_status = document.getElementById( 'pause_play' )
        audio_status.classList.remove( 'fa-play' )
        audio_status.classList.add( 'fa-pause' )
        log( 'soundboard', `randomly playing ${p_idx}, ${s_idx}` )
    }
}
