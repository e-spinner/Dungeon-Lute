// static/js/details.js


// Function to show a specific playlist and its songs
function showPlaylist(p_idx) {
    log('details', 'displaying playlist...');

    // Fetch the list of playlists from the server
    fetch('/playlists')
        .then(response => response.json()) // Parse the response as JSON
        .then(playlists => {
            // Get the specific playlist based on the provided index
            const playlist = playlists[p_idx];

            // Fetch the songs in the selected playlist from the server
            fetch(`/song/${playlist}`)
                .then(response => response.json()) // Parse the response as JSON
                .then(songs => {
                    // Get the elements in the DOM where details and song list are displayed
                    const details = document.getElementById('details');
                    const songList = document.getElementById('song-list');

                    // Clear any existing songs in the song list
                    songList.innerHTML = '';

                    // Iterate over each song in the playlist
                    songs.forEach((song, s_idx) => {
                        // Create a new list item for each song
                        const listItem = document.createElement('li');
                        listItem.innerHTML = song;      // Set the song name as the list item content
                        listItem.id = song;             // Set the song name as the list item ID
                        listItem.className = 'song';    // Assign the class 'song' to the list item
                        listItem.dataset.index = s_idx; // Store the song index as a data attribute

                        // Add a click event listener to the list item to play the song and animate the button
                        listItem.addEventListener('click', () => {
                            playSong(p_idx, s_idx);     // Call the playSong function with the playlist and song index
                            animateButton(song);        // Call the animateButton function with the song name
                        });

                        // Append the list item to the song list
                        songList.appendChild(listItem);
                    });

                    // Remove the fade-out class and add the fade-in class to the details element
                    details.classList.remove('fade-out');
                    details.classList.add('fade-in');

                    // Highlight the currently playing song
                    highlightPlayingSong(playlist);
                });
        });

    log('details', 'playlist displayed');
}

// Function to highlight the currently playing song in the playlist
function highlightPlayingSong(s_idx) {
    log('details', `highlighting ${s_idx}`);

    // Get all elements with the class 'song'
    const songs = document.querySelectorAll('.song');

    // Remove the 'playing' class from all songs
    songs.forEach(song => song.classList.remove('playing'));

    // Fetch the list of playlists from the server
    fetch('/playlists')
        .then(response => response.json()) // Parse the response as JSON
        .then(playlists => {
            // Get the currently playing playlist
            const playlist = playlists[playingIndex];

            // Get the last played song from the currently playing playlist
            const playingSong = lastPlayedSong[playingIndex];

            // If there is a valid playlist and a last played song
            if (playlist && playingSong) {
                // Iterate over each song element
                songs.forEach(song => {
                    // If the song element's text matches the playing song, add the 'playing' class
                    if (song.innerText === playingSong) {
                        song.classList.add('playing');
                    }
                });
            }
        });

    log('details', `highlighted ${s_idx}`);
}