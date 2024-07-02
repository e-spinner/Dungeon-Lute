// static/js/index/details.js

// display playlist details
function showPlaylist( p_idx ) {
    log( 'details', 'displaying playlist...' )

    fetch( '/playlists' )
    .then( response => response.json() )
    .then( playlists => {
        const playlist = playlists[p_idx];

        fetch( `/song/${playlist}` )
        .then( response => response.json() )
        .then( songs => {
            
            const details = document.getElementById( 'details' );
            const name = document.getElementById( 'playlist-name' );
            const songList = document.getElementById( 'song-list' );
        
            name.innerText = playlist;
        
            songList.innerHTML = ''
            songs.forEach( ( song, s_idx ) => {
                const listItem = document.createElement( 'li' )
                listItem.innerHTML = song;
                listItem.id = song;
                listItem.className = 'song';
                listItem.dataset.index = s_idx;
                listItem.addEventListener( 'click', () =>  {
                    playSong( p_idx, s_idx );
                    animateButton(song);
                });
                songList.appendChild( listItem );
            });
        
            details.classList.remove( 'fade-out' ); 
            details.classList.add( 'fade-in' );   
            highlightPlayingSong( playlist );

        });

    });
    

    log( 'details', 'playlist displayed' );
}

// highlight current song
function highlightPlayingSong( s_idx ) {
    log( 'details', `highlighting ${s_idx}` )
    const songs = document.querySelectorAll( '.song' );
    songs.forEach( song => song.classList.remove( 'playing' ) );
    
    fetch( '/playlists' )
    .then( response => response.json() )
    .then( playlists => {
        const playlist = playlists[playingIndex];

        const playingSong = lastPlayedSong[ playingIndex ]

        if ( playlist && playingSong ) {
            songs.forEach( song => {
                if ( song.innerText === playingSong ) {
                    song.classList.add( 'playing' )
                }
            })
        }
    });
    log( 'details', `highlighted ${s_idx}` )

}