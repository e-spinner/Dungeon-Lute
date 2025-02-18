
/* # ============= #
   # MEDIA HANDLER #
   # ============= # */

function fetchMedia( folder, item=null, sub=null ) {
    if( sub == null ) {
        if( item == null ) {
            return fetch( `/load/${folder}` ).then(response => response.json());
        }
        return fetch( `/load/${folder}/${item}` ).then(response => response.json());
    }
    return fetch( `/load/${folder}/${item}/${sub}` ).then(response => response.json());
}

function fetchPlaylists() {
    return fetchMedia( 'playlist' )
}

function fetchSongs( playlist ) {
    return fetchMedia( 'playlist', 'None', playlist )
}

/* # ============= #
   # AUDIO CONTROL #
   # ============= # */

   function rewind() {
    animateButton('rewind');
    if (history.length > 1) {

        history.pop();
        const { p_idx, s_idx } = history[history.length - 1];

        stopCurrentSong();

        playingIndex = p_idx;
        playSong(p_idx, s_idx);
        showPlaylist(p_idx);

        history.pop();
        log('menu-bar', 'rewound successfully');
    } else {
        log('menu-bar', 'cannot rewind');
    }
}

function togglePlayback() {
    animateButton('toggle');
    const pause = document.getElementById('Button-Pause');
    const play = document.getElementById('Button-Play');

    if (audio.paused) {
        audio.play();
        log('menu-bar', 'playing');
        play.classList.add('hidden');
        pause.classList.remove('hidden');
    } else {
        audio.pause();
        log('menu-bar', 'paused');
        play.classList.remove('hidden');
        pause.classList.add('hidden');
    }
}

function next() {
    animateButton('next');
    stopCurrentSong();
    playRandomSong(playingIndex);
    showPlaylist(playingIndex);
    log('menu-bar', 'going to next song');
}

function playSong(p_idx, s_idx) {
    fadeOutSong().then(() => {
        stopCurrentSong();

        fetchPlaylists().then(playlists => {
            const playlist = playlists[p_idx];

            fetchSongs(playlist).then(songs => {
                const song = songs[s_idx]

                if (lastPlayedSong[p_idx] != song) {
                    addToHistory(p_idx, s_idx);
                }
                lastPlayedSong[p_idx] = song;

                audio = new Audio(`/load/playlist/${song}/${playlist}`);

                let initialVolume = document.getElementById('main-volume').value;
                setVolume(initialVolume);

                const name = document.getElementById('song-name');
                name.innerText = song

                audio.addEventListener('timeupdate', () => {
                    if (audio != null && !scrubbing) {
                        const progressBar = document.getElementById('progressBar');
                        const percentage = (audio.currentTime / audio.duration) * 100;
                        progressBar.style.width = `${percentage}%`;
                        const current = document.getElementById('current')
                        current.innerText = formatTime(audio.currentTime)
                        const scrubber = document.getElementById('scrubber')
                        scrubber.value = percentage
                        const duration = document.getElementById('duration')
                        duration.innerText = formatTime(audio.duration);
                    }
                });

                audio.play();
                audio.onended = () => playRandomSong(p_idx);
                highlightPlayingSong(p_idx);

                const pl_ids = document.querySelectorAll('.playlist');
                pl_ids.forEach((id) => {
                    if (id.innerText == playlist) {
                        id.classList.add('playing')
                    }
                });


                audioPlay()
            });
        });
    });
}

function playRandomSong(p_idx) {

    fetchPlaylists().then(playlists => {
        const playlist = playlists[p_idx];

        fetchSongs(playlist).then(songs => {

            if (songs.length > 0) {
                const availableSongs = songs.filter(song => song !== lastPlayedSong[p_idx]);
                if (availableSongs.length === 0) {
                    availableSongs.push(...songs);
                }

                const s_idx = Math.floor(Math.random() * availableSongs.length);
                const song = availableSongs[s_idx];

                if (lastPlayedSong[p_idx] != song) {
                    addToHistory(p_idx, s_idx);
                }
                lastPlayedSong[p_idx] = song;

                const name = document.getElementById('song-name');
                name.innerText = song

                audio = new Audio(`/load/playlist/${song}/${playlist}`);

                let initialVolume = document.getElementById('main-volume').value;
                setVolume(initialVolume);

                audio.addEventListener('timeupdate', () => {
                    if (audio != null && !scrubbing) {
                        const progressBar = document.getElementById('progressBar');
                        const percentage = (audio.currentTime / audio.duration) * 100;
                        progressBar.style.width = `${percentage}%`;
                        const current = document.getElementById('current')
                        current.innerText = formatTime(audio.currentTime)
                        const scrubber = document.getElementById('scrubber')
                        scrubber.value = percentage
                        const duration = document.getElementById('duration')
                        duration.innerText = formatTime(audio.duration);
                    }
                });

                audio.play();
                audio.onended = () => playRandomSong(p_idx);
                highlightPlayingSong(p_idx);

                const pl_ids = document.querySelectorAll('.playlist');
                pl_ids.forEach((id) => {
                    if (id.innerText == playlist) {
                        id.classList.add('playing')
                    }
                });


                audioPlay()

            }
        });
    });
}

function stopCurrentSong() {
    if (audio) {
        audio.pause();
        audio = null;
    }
    if (playingIndex !== null) {
        const pl_ids = document.querySelectorAll('.playlist');
        pl_ids.forEach((id) => {

            id.classList.remove('playing')

        });
    }
    log('soundboard', 'stopping current song')
    document.querySelectorAll('.track').forEach((t) => { t.classList.remove('playing') })
}

function fadeOutSong() {
    return new Promise((resolve) => {
        if (audio) {
            let volume = audio.volume;
            const fadeOutInterval = setInterval(() => {
                if (volume > 0.05) {
                    volume -= 0.05;
                    audio.volume = Math.max(0, volume)
                } else {
                    clearInterval(fadeOutInterval);
                    audio.volume = 0;
                    log('soundboard', 'current audio has beed faded out')
                    resolve()
                }
            }, FADE_OUT_DURATION / 20);
        } else {
            log('soundboard', 'there is no audio to fade out')
            resolve();
        }
    });
}


/* # =========== #
   # SFX CONTROL #
   # =========== # */

function playSfx(sfx_idx, sound) {
    if (soundeffects[sfx_idx]) {
        soundeffects[sfx_idx].pause();
        soundeffects[sfx_idx] = null;
        const t = document.getElementById(sound);
        t.classList.remove('playing');
    }

    else {
        const stop = document.getElementById('stop-button')
        stop.classList.remove("hidden")
        soundeffects[sfx_idx] = new Audio(`/load/sound/${sound}`)

        let initialVolume = document.getElementById(`${sound}-volume`).value;
        setSfxVolume(sfx_idx, sound, initialVolume);

        soundeffects[sfx_idx].play();

        const repeat = document.getElementById(`${sound}-repeat`)
        if (repeat.checked) {
            soundeffects[sfx_idx].loop = true
        }
        else {
            soundeffects[sfx_idx].loop = false
        }

        soundeffects[sfx_idx].onended = () => {
            const t = document.getElementById(sound);
            t.classList.remove('playing');
            soundeffects[sfx_idx] = null;
        }

        const t = document.getElementById(sound);
        t.classList.add('playing');
    }
}

function setSfxVolume(sfx_idx, sound, value) {
    let volumeRange = document.getElementById(`${sound}-range`);
    volumeRange.style.width = (value * 100) + '%';

    if (soundeffects[sfx_idx]) {
        soundeffects[sfx_idx].volume = value;
    }
}

function stopCurrentSfx() {

    soundeffects.forEach((sound) => {
        if (sound) {
            sound.pause()
            sound = null
        }
    })

    const stop = document.getElementById('stop-button')
    stop.classList.add("hidden")
    Array.from(document.querySelectorAll('.effect-button')).forEach((s) => { s.classList.remove('playing') })
}

/* # ============= #
   # TRACK CONTROL #
   # ============= # */

function playTrack(track) {
    playingIndex = -1
    fadeOutSong().then(() => {
        stopCurrentSong();

        audio = new Audio(`/load/track/${track}`);

        audio.addEventListener('timeupdate', () => {
            if (audio != null && !scrubbing) {
                const progressBar = document.getElementById('progressBar');
                const percentage = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${percentage}%`;
                const current = document.getElementById('current')
                current.innerText = formatTime(audio.currentTime)
                const scrubber = document.getElementById('scrubber')
                scrubber.value = percentage
                const duration = document.getElementById('duration')
                duration.innerText = formatTime(audio.duration);
            }
        });

        audio.play();
        audio.onended = () => playTrack(track);


        const t = document.getElementById(track);
        t.classList.add('playing');

        const details = document.getElementById('details');
        details.classList.add('fade-out');
        details.classList.remove('fade-in');


        audioPlay()
    });

}

/* # ================ #
   # HELPER FUNCTIONS #
   # ================ # */

function audioPlay() {
    const pause = document.getElementById('Button-Pause');
    const play = document.getElementById('Button-Play');
    play.classList.add('hidden');
    pause.classList.remove('hidden');
}

function addToHistory(p_idx, s_idx) {
    log('history', `adding ${p_idx}, ${s_idx} to history`);
    history.push({ p_idx, s_idx });
}


function highlightPlayingSong(s_idx) {
    log('details', `highlighting ${s_idx}`);

    const songs = document.querySelectorAll('.song');

    songs.forEach(song => song.classList.remove('playing'));

    fetchPlaylists().then(playlists => {
        const playlist = playlists[playingIndex];

        const playingSong = lastPlayedSong[playingIndex];

        if (playlist && playingSong) {
            songs.forEach(song => {
                if (song.innerText === playingSong) {
                    song.classList.add('playing');
                }
            });
        }
    });

    log('details', `highlighted ${s_idx}`);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function setColors( c ) {
    document.documentElement.style.setProperty( '--text', c[0] );
    document.documentElement.style.setProperty( '--border-color', c[0] );
    document.documentElement.style.setProperty( '--accent', c[3] );
    document.documentElement.style.setProperty( '--hover-accent', adjustLightless(c[3], -10) );
    document.documentElement.style.setProperty( '--secondary-background', c[2] );
    document.documentElement.style.setProperty( '--hover', adjustLightless( c[2], 10 ) );
    document.documentElement.style.setProperty( '--primary-background', c[1] );
    document.documentElement.style.setProperty( '--logo', adjustLightless( c[1], 5 ) );
    const primaryBackground = getComputedStyle( document.documentElement )
        .getPropertyValue( '--primary-background' )
        .trim();
    const primaryBackgroundRgb = HEXtoRGB( primaryBackground );

    document.documentElement.style.setProperty( '--primary-background-rgba', `rgba( ${primaryBackgroundRgb}, 1 )` );
    document.documentElement.style.setProperty( '--primary-background-transparent', `rgba( ${primaryBackgroundRgb}, 0 )` );
}

function saveColors( c ) {
    setColors( c );
    animateButton( 'color-save' );

    fetch( '/save/color/color', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            save: c
        })
    });
}

function setVolume( value ) {
    let volumeRange = document.getElementById( 'main-range' );
    volumeRange.style.width = ( value * 100 ) + '%';

    if ( audio ) {
        audio.volume = value;
    }
}

function togglePlaylist(playlist) {
    const details = document.getElementById('details');
    details.classList.add('fade-out');
    details.classList.remove('fade-in');

    fetchPlaylists().then(playlists => {
        const p_idx = Array.from(playlists).indexOf(playlist)

        if (playingIndex == p_idx) {
            if (audio && !audio.paused) {
                stopCurrentSong();
                const pl_ids = document.querySelectorAll('.playlist');
                pl_ids.forEach((id) => {
                    if (id.innerText == playlists[p_idx]) {
                        id.classList.remove('playing')
                    }
                });
                log('soundboard', `stopped playlist: ${p_idx}`);

                return;
            }
        }
        log('soundboard', `starting playlist: ${p_idx}`);

        fadeOutSong().then(() => {
            stopCurrentSong()

            playingIndex = p_idx
            playRandomSong(p_idx)
            showPlaylist(p_idx)
        });
    });
}

function showPlaylist(p_idx) {
    log('details', 'displaying playlist...')

    fetchPlaylists().then(playlists => {
        const playlist = playlists[p_idx];

        fetchSongs(playlist).then(songs => {

            const details = document.getElementById('details');
            const songList = document.getElementById('song-list');

            songList.innerHTML = ''
            songs.forEach((song, s_idx) => {
                const listItem = document.createElement('li')
                listItem.innerHTML = song;
                listItem.id = song;
                listItem.className = 'song';
                listItem.dataset.index = s_idx;
                listItem.addEventListener('click', () => {
                    playSong(p_idx, s_idx);
                    animateButton(song);
                });
                songList.appendChild(listItem);
            });

            details.classList.remove('fade-out');
            details.classList.add('fade-in');
            highlightPlayingSong(playlist);

        });

    });
}