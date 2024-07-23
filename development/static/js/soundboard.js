// static/js/soundboard.js

document.addEventListener('DOMContentLoaded', (event) => {

    if (window.location.pathname == '/') {

        loadSoundboard('Default');
        loadPresets();
        loadColor();
        loadTrack();
        loadSfx();

        let initialVolume = document.getElementById('main-volume').value;
        setVolume(initialVolume);

        const volumeControl = document.getElementById('main-volume');

        volumeControl.addEventListener('input', (e) => {
            setVolume(e.target.value);
        });

        volumeControl.addEventListener('change', (e) => {
            setVolume(e.target.value);
        });

        fetch('/load/data/color')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    saveColors(data)
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
            current.innerText = formatTime(newTime);
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

        log('soundboard', 'DOMContentLoaded')

        const buttons = document.querySelectorAll(".tab-button");
        const slider = document.getElementById('slider');

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const tab = document.getElementById(button.dataset.tab);


                if (tab.id == 'tab1') {
                    slider.style.transform = "translateX(0%)";
                }
                else if (tab.id == 'tab2') {
                    slider.style.transform = "translateX(-33.3%)";
                }
                else if (tab.id == 'tab3') {
                    slider.style.transform = "translateX(-66.7%)";
                }

                Array.from(document.querySelectorAll('.tab-button')).forEach((t) => { t.classList.remove('active') })
                button.classList.add('active')
            });
        });
    }
});

let scrubbing = false;
function loadSoundboard(preset) {
    log('soundboard', 'loading soundboard...')
    fetch(`/load/${preset}`)
        .then(response => response.json())
        .then(data => {

            const grid = document.getElementById('grid')
            data.forEach((row) => {
                const tr = document.createElement('tr')
                tr.classList.add('row')
                row.forEach((playlist) => {
                    const pl = document.createElement('td');
                    if (playlist != 'blank') {
                        pl.classList.add('playlist')
                        pl.innerText = playlist;
                        pl.id = playlist;
                        pl.onclick = () => {
                            togglePlaylist(playlist);
                            animateButton(playlist);

                        }
                    } else {
                        pl.classList.add('spacer');
                    }
                    tr.appendChild(pl)
                });
                grid.appendChild(tr)
            });
            log('soundboard', 'soundboard loaded')

        });
}
function loadTrack() {
    fetch(`/track`)
        .then(response => response.json())
        .then(tracks => {
            const trackList = document.getElementById('track-list')
            tracks.forEach((track) => {
                const li = document.createElement('li')
                li.innerHTML = track
                li.id = track
                li.className = 'track'
                li.addEventListener('click', () => {
                    animateButton(track)
                    playTrack(track)
                })
                trackList.appendChild(li)
            })
        });
}
function loadSfx() {
    log('loadSfx', 'begin')
    fetch(`/sound`)
        .then(response => response.json())
        .then(sounds => {
            const soundList = document.getElementById('effect-list')
            log('loadSfx', `${soundList}`)
            sounds.forEach((sound) => {
                log('loadSfx', `${sound}`)
                const li = document.createElement('li')
                li.innerHTML = sound
                li.id = sound
                li.className = 'effect'
                li.addEventListener('click', () => {
                    animateButton(sound)
                    playSfx(sound)
                })
                soundList.appendChild(li)
            })
            log('loadSfx', `done`)
        });
}
function togglePlaylist(playlist) {
    const details = document.getElementById('details');
    details.classList.add('fade-out');
    details.classList.remove('fade-in');

    fetch('/playlists')
        .then(response => response.json())
        .then(playlists => {
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

function playSong(p_idx, s_idx) {
    fadeOutSong().then(() => {
        stopCurrentSong();

        fetch('/playlists')
            .then(response => response.json())
            .then(playlists => {
                const playlist = playlists[p_idx];

                fetch(`/song/${playlist}`)
                    .then(response => response.json())
                    .then(songs => {
                        const song = songs[s_idx]

                        if (lastPlayedSong[p_idx] != song) {
                            addToHistory(p_idx, s_idx);
                        }
                        lastPlayedSong[p_idx] = song;

                        audio = new Audio(`/song/${playlist}/${song}`);

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

    fetch('/playlists')
        .then(response => response.json())
        .then(playlists => {
            const playlist = playlists[p_idx];

            fetch(`/song/${playlist}`)
                .then(response => response.json())
                .then(songs => {

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

                        audio = new Audio(`/song/${playlist}/${song}`);

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
function playTrack(track) {
    playingIndex = -1
    fadeOutSong().then(() => {
        stopCurrentSong();

        audio = new Audio(`/track/${track}`);

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
function playSfx(sound) {
    if (sfx) {
        sfx.pause();
        sfx = null;
    }
    const stop = document.getElementById('stop-button')
    stop.classList.remove("hidden")
    sfx = new Audio(`/sound/${sound}`)

    sfx.play();
    sfx.onended = () => {
        const t = document.getElementById(sound);
        t.classList.remove('playing');
        stop.classList.add("hidden")
    }


    const t = document.getElementById(sound);
    t.classList.add('playing');

}
function stopCurrentSfx() {

    if (sfx) {
        sfx.pause();
        sfx = null;
    }

    const stop = document.getElementById('stop-button')
    stop.classList.add("hidden")
    Array.from(document.querySelectorAll('.effect')).forEach((s) => { s.classList.remove('playing') })
}

function setVolume(value) {
    let volumeRange = document.getElementById('main-range');
    volumeRange.style.width = (value * 100) + '%';

    if (audio) {
        audio.volume = value;
    }
}