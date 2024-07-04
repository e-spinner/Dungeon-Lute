// static/js/index/soundboard.js
document.addEventListener( 'DOMContentLoaded', ( event ) => {

  if ( window.location.pathname == '/') {

    ls( 'Default' );
    lr();
    lc();

    fetch( '/load/data/color' )
    .then( response => response.json() )
    .then( data => {
        if ( data.length > 0 ) {
            sc(data)
            colors = data
            const scrubber = document.getElementById('scrubber')
            scrubber.value = 0
        }
    });

    scrubber.addEventListener('input', () => {
        scrubbing = true;
        const percentage = scrubber.value;
        const newTime = (percentage / 100) * audio.duration;
        progressBar.style.width = `${percentage}%`;
        current.innerText = ft(newTime);
    });
    
    scrubber.addEventListener('change', () => {
        scrubbing = false;
        const percentage = scrubber.value;
        audio.currentTime = (percentage / 100) * audio.duration;
    });
    
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const offsetX = e.clientX - rect.left; 
        const percentage = offsetX / rect.width; 
        audio.currentTime = percentage * audio.duration; 
        progressBar.style.width = `${percentage * 100}%`;
    });

    log( 'soundboard', 'DOMContentLoaded' )
  }
});

let scrubbing = false;    
function ls( preset ) {
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
                        t( playlist );
                        a(playlist);

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
function t( playlist ) {
    const details = document.getElementById( 'details' ); 
    details.classList.add( 'fade-out' );  
    details.classList.remove( 'fade-in' );   

    fetch( '/playlists' )
    .then( response => response.json() )
    .then( playlists => {
        const p_idx = Array.from( playlists ).indexOf( playlist )

        if ( playingIndex == p_idx ) {
            if ( audio && !audio.paused ) {
                z();               
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

        f().then( () => {
            z()

            playingIndex = p_idx
            L( p_idx )
            sp( p_idx )
        });
    });
}
function z() {
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
function f() {
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
function l( p_idx, s_idx ) {
    f().then( () => {
        z();
        
        fetch( '/playlists' )
        .then( response => response.json() )
        .then( playlists => {
            const playlist = playlists[p_idx];
    
            fetch( `/song/${playlist}` )
            .then( response => response.json() )
            .then( songs => {
                const song = songs[s_idx]

                if ( lastPlayedSong[p_idx] != song ) {
                    ah( p_idx, s_idx );
                }
                lastPlayedSong[p_idx] = song;

                audio = new Audio( `/song/${playlist}/${song}` );

                const name = document.getElementById( 'song-name' );
                name.innerText = song

                audio.addEventListener('timeupdate', () => {
                    if ( audio != null && !scrubbing ) {
                        const progressBar = document.getElementById('progressBar');
                        const percentage = (audio.currentTime / audio.duration) * 100;
                        progressBar.style.width = `${percentage}%`;
                        const current = document.getElementById('current')
                        current.innerText = ft(audio.currentTime)
                        const scrubber = document.getElementById('scrubber')
                        scrubber.value = percentage
                        const duration = document.getElementById('duration')
                        duration.innerText = ft(audio.duration);
                    }
                });

                audio.play();
                audio.onended = () => L( p_idx );
                h( p_idx );

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
function L( p_idx ) {

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
                    ah( p_idx, s_idx );
                }
                lastPlayedSong[p_idx] = song;

                const name = document.getElementById( 'song-name' );
                name.innerText = song

                audio = new Audio( `/song/${playlist}/${song}` );

                audio.addEventListener('timeupdate', () => {
                    if ( audio != null && !scrubbing ) {
                        const progressBar = document.getElementById('progressBar');
                        const percentage = (audio.currentTime / audio.duration) * 100;
                        progressBar.style.width = `${percentage}%`;
                        const current = document.getElementById('current')
                        current.innerText = ft(audio.currentTime)
                        const scrubber = document.getElementById('scrubber')
                        scrubber.value = percentage
                        const duration = document.getElementById('duration')
                        duration.innerText = ft(audio.duration);
                    }
                });

                audio.play();
                audio.onended = () => L( p_idx );
                h( p_idx );

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
