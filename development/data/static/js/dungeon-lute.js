// ./static/js/dungeon-lute.js

/* # =================== #
   # GLOBAL DECLARATIONS #
   # =================== # */

let playingIndex = null;
let lastPlayedSong = {};
let audio = null;
let history = [];
let soundBoard = [];
let soundeffects = [];
let scrubbing = false;

const FADE_OUT_DURATION = 1000;
let colors = ['#ffffff', '#292b2c', '#343a40', '#007bff']

/* # ============== #
   # MAIN FUNCTIONS #
   # ============== # */

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

function showPlaylist(p_idx) {
    log('details', 'displaying playlist...')

    fetch('/playlists')
        .then(response => response.json())
        .then(playlists => {
            const playlist = playlists[p_idx];

            fetch(`/song/${playlist}`)
                .then(response => response.json())
                .then(songs => {

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

/* # ============= #
   # TRACK CONTROL #
   # ============= # */

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
        soundeffects[sfx_idx] = new Audio(`/sound/${sound}`)

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

/* # ================ #
   # LOADER FUNCTIONS #
   # ================ # */

function loadPresets() {
    log('menu-bar', 'loading presets...')

    fetch('/load')
        .then(response => response.json())
        .then(presets => {
            const se = document.getElementById('presets');

            presets.forEach(preset => {
                const box = document.createElement('div');

                const p = document.createElement('a');
                p.id = preset;
                p.innerText = preset;
                p.classList.add('song');
                p.addEventListener('click', () => {
                    animateButton(preset);
                    const grid = document.getElementById('grid');
                    grid.innerHTML = '';
                    loadSoundboard(preset);
                    closeMenu('presets');
                    setTimeout(() => {
                        closeMenu('settings');
                    }, 300);
                });

                box.appendChild(p);

                const del = document.createElement('button');
                del.classList.add('preset-del');
                del.addEventListener('click', () => {
                    fetch(`/del/${preset}`)
                        .then(response => {
                            box.classList.add('fade-out');
                        });
                });
                del.title = `delete ${preset}`;

                var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("class", "delete");
                svg.setAttribute("fill", "none");
                svg.setAttribute("viewBox", "0 0 20 20");
                svg.setAttribute("height", "20");
                svg.setAttribute("width", "20");

                var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
                use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#delete");

                svg.appendChild(use);
                del.appendChild(svg);
                box.append(del);
                box.classList.add('preset-container');
                se.appendChild(box);
            });
        });
}

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
            let count = 0
            const grid = document.getElementById('effect-grid')
            log('loadSfx', `${JSON.stringify(sounds)}`)
            sounds.forEach((sound) => {

                const sfx_idx = count

                const button = document.createElement('div')
                button.id = sound
                button.className = 'effect-button'

                const text = document.createElement('p')
                text.innerText = sound
                text.onclick = () => {
                    playSfx(sfx_idx, sound)
                }
                button.appendChild(text)

                const control = document.createElement('div')
                control.id = `${sound}-control`
                control.classList.add('volume-control', 'sfx')

                const range = document.createElement('div')
                range.id = `${sound}-range`
                range.className = 'volume-range'
                control.appendChild(range)

                const slider = document.createElement('input')
                slider.id = `${sound}-volume`
                slider.className = 'volume'
                slider.type = 'range'
                slider.min = '0'
                slider.max = '1'
                slider.step = '0.01'
                slider.value = '0.5'
                slider.onchange = `setSfxVolume(${sfx_idx}, this.value)`
                control.appendChild(slider)

                button.appendChild(control)

                const repeat = document.createElement('input')
                repeat.id = `${sound}-repeat`
                repeat.className = 'repeat'
                repeat.title = 'toggle repeating'
                repeat.type = 'checkbox'
                button.appendChild(repeat)

                grid.appendChild(button)

                slider.addEventListener('input', (e) => {
                    setSfxVolume(sfx_idx, sound, e.target.value);
                });

                slider.addEventListener('change', (e) => {
                    setSfxVolume(sfx_idx, sound, e.target.value);
                });

                count += 1
            })
            log('loadSfx', `done`)
        });
}

function loadColor() {
    document.getElementById('text-color').addEventListener('input', function () {
        document.documentElement.style.setProperty('--t-text', this.value);
        document.documentElement.style.setProperty('--t-border-color', this.value);
        colors[0] = this.value;
    });

    document.getElementById('accent-color').addEventListener('input', function () {
        document.documentElement.style.setProperty('--t-accent', this.value);
        document.documentElement.style.setProperty('--t-hover-accent', adjustLightless(this.value, -10));
        colors[3] = this.value;
    });

    document.getElementById('secondary-color').addEventListener('input', function () {
        document.documentElement.style.setProperty('--t-secondary-background', this.value);
        document.documentElement.style.setProperty('--t-hover', adjustLightless(this.value, 10));
        colors[2] = this.value;
    });

    document.getElementById('primary-color').addEventListener('input', function () {
        document.documentElement.style.setProperty('--t-primary-background', this.value);
        colors[1] = this.value;
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
function setVolume(value) {
    let volumeRange = document.getElementById('main-range');
    volumeRange.style.width = (value * 100) + '%';

    if (audio) {
        audio.volume = value;
    }
}
function animateButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.classList.add("clicked");
    setTimeout(() => {
        button.classList.remove("clicked");
    }, 300);
}
function highlightPlayingSong(s_idx) {
    log('details', `highlighting ${s_idx}`);

    const songs = document.querySelectorAll('.song');

    songs.forEach(song => song.classList.remove('playing'));

    fetch('/playlists')
        .then(playlists => {
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
function log(origin, message) {
    fetch('/log', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ origin: origin, message: message })
    });
}
function closeProgram() {
    fetch('/stop')
    setTimeout(() => {
        location.reload()
    }, 500); history
}
function edit() {
    log('util', 'loading edit.html')
    animateButton('edit')
    window.location.href = '/edit'
}
function openMenu(menu) {
    animateButton(`${menu}-open`)
    document.getElementById(`${menu}-menu`).style.width = '100%';
    setTimeout(() => {
        document.getElementById(`${menu}`).classList.add('active');
    }, 300);
}
function closeMenu(menu) {
    animateButton(`${menu}-close`)
    document.getElementById(`${menu}-menu`).style.width = "0%";
    document.getElementById(`${menu}`).classList.remove('active');
}
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/* # =============== #
   # COLOR FUNCTIONS #
   # =============== # */

function saveColors(c) {
    document.documentElement.style.setProperty('--text', c[0]);
    document.documentElement.style.setProperty('--border-color', c[0]);
    document.documentElement.style.setProperty('--accent', c[3]);
    document.documentElement.style.setProperty('--hover-accent', adjustLightless(c[3], -10));
    document.documentElement.style.setProperty('--secondary-background', c[2]);
    document.documentElement.style.setProperty('--hover', adjustLightless(c[2], 10));
    document.documentElement.style.setProperty('--primary-background', c[1]);
    document.documentElement.style.setProperty('--logo', adjustLightless(c[1], 5));
    const primaryBackground = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-background')
        .trim();

    const primaryBackgroundRgb = HEXtoRGB(primaryBackground);

    document.documentElement.style.setProperty('--primary-background-rgba', `rgba(${primaryBackgroundRgb}, 1)`);
    document.documentElement.style.setProperty('--primary-background-transparent', `rgba(${primaryBackgroundRgb}, 0)`);

    if (window.location.pathname == '/]') {
        animateButton('color-save')
    }

    fetch('/save/data/color', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(c)
    })
}

