// static/js/menu-bar.js

let playingIndex = null;
let lastPlayedSong = {};
let audio = null;
let history = [];
let soundBoard = [];

const FADE_OUT_DURATION = 1000;

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

function audioPlay() {
    const pause = document.getElementById('Button-Pause');
    const play = document.getElementById('Button-Play');
    play.classList.add('hidden');
    pause.classList.remove('hidden');
}

function next() {
    animateButton('next');
    stopCurrentSong();
    playRandomSong(playingIndex);
    showPlaylist(playingIndex);
    log('menu-bar', 'going to next song');
}

function addToHistory(p_idx, s_idx) {
    log('history', `adding ${p_idx}, ${s_idx} to history`);
    history.push({ p_idx, s_idx });
}