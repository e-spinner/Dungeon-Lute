// static/js/index/details.js

// display playlist details
function showPlaylist( p_idx ) {
    log( 'details', 'displaying playlist...' )
    const playlist = playlists[index];
    
    const details = document.getElementById( 'details' );
    const name = document.getElementById( 'playlist-name' );
    const songList = document.getElementById( 'song-list' );

    name.innerText = playlist.name;

    songList.innerHTML = ''
    playlist.songs.forEach( ( song, s_idx ) => {
        const listItem = document.createElement( 'li' )
        listItem.innerHTML = song;
        listItem.className = 'song';
        listItem.dataset.index = s_idx;
        listItem.addEventListener( 'click', () => playSong( p_idx, s_idx ) );
        songList.appendChild( listItem );
    });

    details.classList.add( 'playing' );
    highlightPlayingSong( p_idx );
    log( 'details', 'playlist displayed' );
}

// highlight current song
function highlightPlayingSong( s_idx ) {
    log( 'details', `highlighting ${s_idx}` )
    const songs = document.querySelectorAll( '.song' );
    songs.forEach( song => song.classList.remove( 'playing' ) );
    
    const playlist = playlists[ playingIndex ]
    const playingSong = lastPlayedSong[ playingIndex ]

    if ( playlist && playingSong ) {
        songList.forEach( song => {
            if ( song.innerText === playingSong ) {
                song.classList.add( 'playing' )
            }
        })
    }

}