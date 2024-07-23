// static/js/menu-bar.js

let playingIndex = null;    // Index of the currently playing playlist
let lastPlayedSong = {};    // Store details of the last played song
let audio = null;           // Audio element for playing songs
let sfx = null;             // Audio element for sound effects
let history = [];           // History of played songs
let soundBoard = [];        // Array to store soundboard presets

const FADE_OUT_DURATION = 1000; // Duration for fade out animations

// Function to load the list of presets
function loadPresets() {
    log('menu-bar', 'loading presets...')

    fetch('/load') // Fetch the list of presets from the server
        .then(response => response.json())
        .then(presets => {
            const se = document.getElementById('presets');  // Get the presets container element

            presets.forEach(preset => {
                const box = document.createElement('div');  // Create a container for each preset

                const p = document.createElement('a');      // Create a link element for the preset
                p.id = preset;
                p.innerText = preset;
                p.classList.add('song');
                p.addEventListener('click', () => {         // Add click event listener to load the preset
                    animateButton(preset);                  // Animate the button
                    const grid = document.getElementById('grid');   // Get the grid element
                    grid.innerHTML = '';                            // Clear the grid
                    loadSoundboard(preset);                         // Load the soundboard for the selected preset
                    closeMenu('presets');                           // Close the presets menu
                    setTimeout(() => {
                        closeMenu('settings');                      // Close the settings menu after a delay
                    }, 300);
                });

                box.appendChild(p);                             // Add the link to the container

                const del = document.createElement('button');   // Create a button to delete the preset
                del.classList.add('preset-del');
                del.addEventListener('click', () => {           // Add click event listener to delete the preset
                    fetch(`/del/${preset}`)
                        .then(response => {
                            box.classList.add('fade-out');      // Fade out the container on successful delete
                        });
                });
                del.title = `delete ${preset}`;                 // Set the button title

                // Create an SVG icon for the delete button
                var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("class", "delete");
                svg.setAttribute("fill", "none");
                svg.setAttribute("viewBox", "0 0 20 20");
                svg.setAttribute("height", "20");
                svg.setAttribute("width", "20");

                var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
                use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#delete");

                svg.appendChild(use);
                del.appendChild(svg);                   // Add the SVG icon to the button
                box.append(del);                        // Add the delete button to the container
                box.classList.add('preset-container');  // Add the preset container class
                se.appendChild(box);                    // Add the container to the presets element
            });
        });
}

// Function to rewind to the previous song
function rewind() {
    animateButton('rewind');        // Animate the button
    if (history.length > 1) {       // Check if there are songs in the history

        history.pop();              // Remove the current song from the history
        const { p_idx, s_idx } = history[history.length - 1];   // Get the previous song details

        stopCurrentSong();          // Stop the current song

        playingIndex = p_idx;       // Update the playing index
        playSong(p_idx, s_idx);     // Play the previous song
        showPlaylist(p_idx);        // Show the playlist for the previous song

        history.pop();              // Remove the previous song from the history
        log('menu-bar', 'rewound successfully');
    } else {
        log('menu-bar', 'cannot rewind');
    }
}

// Function to toggle playback of the current song
function togglePlayback() {
    animateButton('toggle');                                // Animate the button
    const pause = document.getElementById('Button-Pause');  // Get the pause button element
    const play = document.getElementById('Button-Play');    // Get the play button element

    if (audio.paused) {                     // Check if the audio is paused
        audio.play();                       // Play the audio
        log('menu-bar', 'playing');
        play.classList.add('hidden');       // Hide the play button
        pause.classList.remove('hidden');   // Show the pause button
    } else {
        audio.pause();                      // Pause the audio
        log('menu-bar', 'paused');
        play.classList.remove('hidden');    // Show the play button
        pause.classList.add('hidden');      // Hide the pause button
    }
}

// Function to handle audio play event
function audioPlay() {
    const pause = document.getElementById('Button-Pause');  // Get the pause button element
    const play = document.getElementById('Button-Play');    // Get the play button element
    play.classList.add('hidden');                           // Hide the play button
    pause.classList.remove('hidden');                       // Show the pause button
}

// Function to play the next song
function next() {
    animateButton('next');                  // Animate the button
    stopCurrentSong();                      // Stop the current song
    playRandomSong(playingIndex);           // Play a random song from the current playlist
    showPlaylist(playingIndex);             // Show the playlist for the current song
    log('menu-bar', 'going to next song');  // Log the next song action
}

// Function to add a song to the history
function addToHistory(p_idx, s_idx) {
    log('history', `adding ${p_idx}, ${s_idx} to history`);
    history.push({ p_idx, s_idx });         // Add the song details to the history
}
